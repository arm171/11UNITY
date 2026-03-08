# 📁 Файл: frontend/js/auth.js

## Что это такое?
Модуль авторизации на frontend'е. Отвечает за:
- Создание модального окна входа/регистрации
- Обработку форм входа и регистрации
- Переключатель языка
- Профиль пользователя (показ/скрытие)
- Редактирование профиля
- Выход из системы

---

## ФУНКЦИЯ: init() — запуск модуля

```js
init() {
    this.createAuthModal();       // 1. Создать HTML модального окна
    this.setupLanguageSwitcher(); // 2. Настроить переключатель языка
    this.setupFooterYear();       // 3. Поставить год в footer
    this.attachEventListeners();  // 4. Навесить обработчики кликов
    this.updateUI();              // 5. Обновить UI (авторизован или нет)
},
```

---

## ФУНКЦИЯ: createAuthModal() — создание модального окна

```js
createAuthModal() {
    const modalHTML = `
        <div class="modal" id="auth-modal">
            ...форма входа...
            ...форма регистрации...
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
```

**`insertAdjacentHTML('beforeend', html)`** — вставить HTML в конец элемента:
```
beforebegin — перед элементом
afterbegin  — в начало внутрь
beforeend   — в конец внутрь  ← наш случай
afterend    — после элемента
```
Модальное окно создаётся динамически через JS, его нет в index.html!
Это делается чтобы не загромождать HTML — модал создаётся только при инициализации Auth.

**Template literal для HTML:**
```js
const html = `
    <div class="modal">
        <h2>${title}</h2>
    </div>
`;
```
Позволяет писать многострочный HTML прямо в JS с переменными.

---

## ФУНКЦИЯ: setupLanguageSwitcher() — переключатель языка

```js
setupLanguageSwitcher() {
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');

    // Клик на кнопку — открыть/закрыть дропдаун
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();                          // не закрыть сразу же!
        langDropdown.classList.toggle('active');      // переключить класс
    });

    // Клик на язык — сменить язык
    langDropdown.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const lang = e.target.getAttribute('data-lang'); // взять data-lang
            I18n.setLanguage(lang);
            langDropdown.classList.remove('active');  // закрыть
        });
    });

    // Клик вне дропдауна — закрыть
    document.addEventListener('click', () => {
        langDropdown.classList.remove('active');
    });
},
```

**`classList.toggle('active')`** — если класс есть → убрать, если нет → добавить:
```js
// div.classList = ['lang-dropdown']
div.classList.toggle('active')  // → ['lang-dropdown', 'active']
div.classList.toggle('active')  // → ['lang-dropdown']
```

**`e.stopPropagation()`** — остановить всплытие события:
```
Клик на langBtn → событие идёт вверх: langBtn → nav → body → document
document.addEventListener('click') → сразу закроет дропдаун!

Без stopPropagation: открыли → сразу закрылось (click дошёл до document)
С stopPropagation: клик на кнопке не дойдёт до document → дропдаун останется
```

**`querySelectorAll('.lang-option')`** — найти ВСЕ элементы с классом.
Возвращает NodeList. forEach перебирает каждый.

**`e.target.getAttribute('data-lang')`** — прочитать атрибут:
```html
<button data-lang="ru">Русский</button>
```
```js
e.target.getAttribute('data-lang')  // → 'ru'
// или короче:
e.target.dataset.lang               // → 'ru'
```

---

## ФУНКЦИЯ: attachEventListeners() — обработчики событий

```js
// Кнопки открытия модала
getStartedBtn.addEventListener('click', () => this.openAuthModal('login'));
heroCTA.addEventListener('click', () => this.openAuthModal('login'));

// Закрытие модала
closeBtn.addEventListener('click', () => this.closeAuthModal());
overlay.addEventListener('click', () => this.closeAuthModal());  // клик вне модала

// Вкладки login/register
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
    });
});

// Отправка форм
loginForm.addEventListener('submit', (e) => this.handleLogin(e));
registerForm.addEventListener('submit', (e) => this.handleRegister(e));

// Проверка совпадения паролей в реальном времени
confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
password.addEventListener('input', () => this.validatePasswordMatch());

// Клавиша Escape — закрыть модал
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') this.closeAuthModal();
});
```

**`addEventListener('submit', fn)`** — форма отправлена (Enter или кнопка).
**`addEventListener('input', fn)`** — значение поля изменилось (каждый символ).
**`addEventListener('keydown', fn)`** — нажата клавиша.
**`e.key`** — название клавиши: 'Escape', 'Enter', 'ArrowUp' и т.д.

---

## ФУНКЦИЯ: handleLogin() — обработка входа

```js
async handleLogin(e) {
    e.preventDefault();  // не перезагружать страницу при submit формы!

    // Показать спиннер на кнопке
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;  // заблокировать двойной клик

    try {
        const credentials = {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value,
        };

        await API.login(credentials);   // отправить на сервер

        UI.showNotification('Logged in!', 'success');
        this.closeAuthModal();
        this.updateUI();                // обновить навигацию

        // Перезагрузить данные с учётом новой роли
        Tournaments.load();
        Teams.load();
        Statistics.load();

    } catch (error) {
        UI.showNotification(error.message, 'error');  // показать ошибку
    } finally {
        // Скрыть спиннер в любом случае (успех или ошибка)
        btnText.style.display = 'inline-block';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
},
```

**`e.preventDefault()`** — отменить стандартное поведение события.
Для form submit — без этого страница перезагрузится!

**`try/catch/finally`:**
```js
try {
    // рискованный код
} catch (error) {
    // если ошибка
} finally {
    // ВСЕГДА выполнится — и при успехе и при ошибке
    // Идеально для скрытия спиннера
}
```

**`.value`** — текущее значение input поля.
**`.value.trim()`** — убрать лишние пробелы по краям.

---

## ФУНКЦИЯ: updateUI() — показать/скрыть элементы по роли

```js
updateUI() {
    if (API.isAuthenticated()) {
        const user = API.getUser();

        // Скрыть кнопку "Get Started"
        getStartedBtn.classList.remove('show');

        // Показать кнопки по роли
        if (user.role === 'organizer') {
            createTournamentBtn.style.display = 'inline-flex';
        }
        if (user.role === 'coach') {
            createTeamBtn.style.display = 'inline-flex';
        }

    } else {
        // Не авторизован — показать Get Started, скрыть остальное
        getStartedBtn.classList.add('show');
        createTournamentBtn.style.display = 'none';
        createTeamBtn.style.display = 'none';
    }

    this.updateProfileSection();  // hero vs profile dashboard
},
```

---

## ФУНКЦИЯ: updateProfileSection() — hero vs профиль

```js
updateProfileSection() {
    if (API.isAuthenticated()) {
        const user = API.getUser();
        heroSection.style.display = 'none';     // скрыть приветствие
        profileSection.style.display = 'block'; // показать профиль

        // Заполнить данные
        nameEl.textContent = user.name;
        emailEl.textContent = user.email;

        // Аватар — первые буквы имени и фамилии
        const initials = user.name
            .split(' ')           // ['Arman', 'Grigoryan']
            .map(n => n[0])       // ['A', 'G']
            .join('')             // 'AG'
            .toUpperCase()        // 'AG'
            .slice(0, 2);         // 'AG' (максимум 2 буквы)
        avatarEl.innerHTML = `<span>${initials}</span>`;

    } else {
        heroSection.style.display = 'block';
        profileSection.style.display = 'none';
    }
},
```

**`.split(' ')`** — разбить строку по пробелу → массив слов.
**`.map(n => n[0])`** — взять первый символ каждого слова.
**`.join('')`** — соединить массив в строку без разделителя.
**`.slice(0, 2)`** — взять первые 2 символа.

---

## ФУНКЦИЯ: renderPlayerProfile() — профиль игрока

Строит HTML строку для профиля и вставляет через innerHTML:
```js
let html = `
    <div class="profile-stat-cards">
        <div class="profile-stat-card">
            <strong>${stats.goals}</strong>
            <span>Goals</span>
        </div>
        ...
    </div>
`;

// Условный рендер (тернарный оператор в шаблоне):
${team.position ? `<div>...</div>` : ''}
// Если position есть → HTML блок, если нет → пустая строка

container.innerHTML = html;  // вставить весь HTML
```

**Три профиля для трёх ролей:**
- `renderPlayerProfile` → команда, позиция, номер, голы, ассисты, карточки
- `renderCoachProfile` → команда, состав, результаты (W/D/L)
- `renderOrganizerProfile` → список турниров, счётчики

---

## ФУНКЦИЯ: openEditProfileModal() — создание на лету

```js
openEditProfileModal() {
    let modal = document.getElementById('edit-profile-modal');

    if (!modal) {
        // Создать элемент
        modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'edit-profile-modal';
        modal.innerHTML = `...форма...`;
        document.body.appendChild(modal);  // добавить в body
    }

    // Заполнить текущими данными
    document.getElementById('edit-profile-name').value = user.name;
    UI.openModal('edit-profile-modal');
},
```

**`document.createElement('div')`** — создать новый DOM элемент.
**`element.appendChild(child)`** — добавить дочерний элемент.
Проверка `if (!modal)` — создаём только один раз, при повторном открытии переиспользуем.

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `insertAdjacentHTML('beforeend', html)` | Вставить HTML в конец элемента |
| `classList.toggle('name')` | Добавить класс если нет, убрать если есть |
| `classList.add/remove('name')` | Добавить/убрать CSS класс |
| `e.preventDefault()` | Отменить стандартное поведение (перезагрузку формы) |
| `e.stopPropagation()` | Остановить всплытие события вверх по DOM |
| `try/catch/finally` | finally всегда выполняется |
| `element.value` | Текущее значение input поля |
| `querySelectorAll(selector)` | Найти все элементы по CSS селектору |
| `NodeList.forEach(fn)` | Перебрать все найденные элементы |
| `e.target.getAttribute('attr')` | Прочитать атрибут элемента |
| `e.target.dataset.name` | Прочитать data-name атрибут |
| `e.key` | Название нажатой клавиши |
| `document.createElement('tag')` | Создать новый HTML элемент |
| `parent.appendChild(child)` | Добавить элемент в конец родителя |
| `.split(' ').map(fn).join('')` | Разбить строку → обработать → собрать |

---

## ❓ Вопросы с защиты

**Q: Почему модальное окно создаётся в JS а не в HTML?**
A: Разделение ответственности. Auth модуль сам создаёт нужный HTML. index.html остаётся чистым. Также это позволяет создавать элементы только когда они нужны.

**Q: Зачем e.preventDefault() при submit формы?**
A: Стандартное поведение form submit — перезагрузить страницу. Это нам не нужно — мы SPA. preventDefault() отменяет перезагрузку и мы сами обрабатываем данные через fetch.

**Q: Зачем stopPropagation на кнопке языка?**
A: Клик всплывает по DOM вверх. document.addEventListener('click') закрывает дропдаун. Без stopPropagation — открыли дропдаун, клик дошёл до document → сразу закрылось. stopPropagation останавливает всплытие.

**Q: Что такое finally в try/catch?**
A: Блок который выполняется ВСЕГДА — и при успехе и при ошибке. Идеален для сброса состояния UI (скрыть спиннер, включить кнопку). Без finally нужно дублировать код в try и catch.

**Q: Как аватар генерируется из имени?**
A: Разбиваем имя по пробелам, берём первую букву каждого слова, соединяем. "Arman Grigoryan" → ['Arman','Grigoryan'] → ['A','G'] → 'AG'. Максимум 2 символа через slice(0,2).

**Q: Почему кнопки "Создать турнир" и "Создать команду" скрыты по умолчанию?**
A: В HTML style="display:none". updateUI() показывает их только нужной роли. Organizer видит кнопку турнира, Coach — команды. Гости и игроки не видят ни одну.
