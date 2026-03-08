# 📁 Файл: frontend/js/ui.js

## Что это такое?
Модуль общих UI компонентов — переиспользуемые функции интерфейса.
Не содержит бизнес-логику (турниры, команды). Только чистый UI:
уведомления, загрузка, навигация, модалы, кнопки.

Все другие модули (auth, tournaments, teams...) вызывают UI.showNotification(), UI.openModal() и т.д.

---

## ФУНКЦИЯ 1: showNotification() — всплывающее уведомление

```js
showNotification(message, type = 'info', duration = 3000) {
    // Создать элемент
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    // → class="notification notification-success"
    // → class="notification notification-error"

    // Иконка по типу
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error:   '<i class="fas fa-exclamation-circle"></i>',
        info:    '<i class="fas fa-info-circle"></i>',
    };

    notification.innerHTML = `${icons[type]} <span>${message}</span>`;
    document.body.appendChild(notification);  // добавить на страницу

    // Убрать через duration миллисекунд
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';  // анимация исчезновения
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);  // удалить из DOM
            }
        }, 300);  // ждём 0.3с пока анимация завершится
    }, duration);
},
```

**`type = 'info'`** — параметр по умолчанию. Если не передать type — будет 'info'.
**`duration = 3000`** — по умолчанию 3 секунды.

**Двойной setTimeout:**
```
setTimeout(1): через 3000мс → запустить анимацию исчезновения
setTimeout(2): через 300мс → удалить элемент из DOM
```
Почему два? Нельзя удалить сразу — анимация не успеет проиграть.
Сначала даём анимации поиграть (300мс), потом удаляем.

**`notification.parentNode.removeChild(notification)`**:
- `parentNode` — родительский элемент (body)
- `removeChild(child)` — удалить дочерний элемент
- Проверка `if (notification.parentNode)` — элемент ещё в DOM?

**Объект как словарь:**
```js
const icons = {
    success: '...',
    error: '...',
    info: '...',
};
icons[type]  // icons['success'] → '<i class="fas fa-check-circle"></i>'
```
Вместо if/else для каждого типа — просто берём по ключу.

---

## ФУНКЦИЯ 2: showLoading() / hideLoading()

```js
showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
},

hideLoading(containerId) {
    const loader = container.querySelector('.loading-indicator');
    if (loader) loader.remove();  // .remove() — удалить элемент
    container.style.display = '';  // сбросить inline стиль
},
```

**`element.remove()`** — удалить элемент из DOM (короче чем removeChild).
**`container.style.display = ''`** — пустая строка сбрасывает inline стиль → применится CSS из таблицы стилей.

---

## ФУНКЦИЯ 3: initNavigation() — умная навигация

```js
initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    // Клик на ссылку — прокрутить к секции
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();  // не прыгать по якорю сразу

            // Убрать active у всех, добавить у нажатой
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Плавно прокрутить
            this.scrollToSection(link.getAttribute('href'));
        });
    });

    // Прокрутка страницы — активировать ссылку видимой секции
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;  // позиция секции от верха страницы
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
},
```

**`section.offsetTop`** — расстояние от верха страницы до секции в пикселях.
**`window.pageYOffset`** — сколько пикселей прокручено вниз.
**Логика:** если прокрутили >= начало секции - 150px → эта секция "активная".
`-150` — небольшой отступ чтобы ссылка переключалась чуть раньше.

---

## ФУНКЦИЯ 4: initMobileMenu() — мобильное меню

```js
initMobileMenu() {
    // Внутренняя функция закрытия (используется в нескольких местах)
    const closeMenu = () => {
        burgerBtn.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';  // разрешить прокрутку
    };

    // Кнопка бургер — открыть/закрыть
    burgerBtn.addEventListener('click', () => {
        burgerBtn.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        // Заблокировать прокрутку когда меню открыто
        document.body.style.overflow = mobileNavOverlay.classList.contains('active') ? 'hidden' : '';
    });
}
```

**`document.body.style.overflow = 'hidden'`** — заблокировать прокрутку страницы.
Когда мобильное меню открыто — фон не должен прокручиваться.
При закрытии — `overflow = ''` сбрасывает к CSS значению.

**`classList.contains('active')`** — проверить есть ли класс:
```js
element.classList.contains('active')  // → true или false
```
Используем чтобы узнать открыто ли меню и установить overflow.

---

## ФУНКЦИЯ 5: openModal() / closeModal()

```js
openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');          // показать через CSS
        document.body.style.overflow = 'hidden'; // заблокировать прокрутку
    }
},

closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');  // скрыть
        document.body.style.overflow = 'auto'; // вернуть прокрутку
    }
},
```

Модал показывается/скрывается через CSS класс `active`:
```css
.modal { display: none; }
.modal.active { display: flex; }
```
JS только добавляет/убирает класс — CSS делает остальное.

---

## ФУНКЦИЯ 6: showButtonLoading() / hideButtonLoading()

```js
showButtonLoading(button) {
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');

    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline-block';
    button.disabled = true;  // нельзя нажать второй раз
},

hideButtonLoading(button) {
    if (btnText) btnText.style.display = 'inline-block';
    if (spinner) spinner.style.display = 'none';
    button.disabled = false;
},
```

Паттерн кнопки с загрузкой:
```html
<button>
    <span class="btn-text">Save</span>      ← текст (виден обычно)
    <div class="spinner" style="display:none;"></div>  ← спиннер (скрыт)
</button>
```
При нажатии: текст скрыть → спиннер показать → кнопку заблокировать.
В finally: всё вернуть обратно.

**`button.querySelector('.btn-text')`** — найти дочерний элемент внутри button.
Ищет только внутри button, не по всему документу.

---

## ФУНКЦИЯ 7: formatDate() / formatDateTime()

```js
formatDate(dateString) {
    if (window.I18n) {
        return I18n.formatDate(dateString);  // делегируем i18n
    }
    // Запасной вариант:
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    // → "May 15, 2026"
},
```

**`date.toLocaleDateString(locale, options)`** — форматировать дату по локали:
```js
new Date('2026-05-15').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
// → "May 15, 2026"

new Date('2026-05-15').toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' })
// → "15 мая 2026 г."
```

---

## 🔑 JS и DOM концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `document.createElement('div')` | Создать элемент |
| `element.className = 'a b'` | Установить классы |
| `element.innerHTML = html` | Вставить HTML содержимое |
| `parent.appendChild(child)` | Добавить дочерний элемент |
| `parent.removeChild(child)` | Удалить дочерний элемент |
| `element.remove()` | Удалить себя из DOM |
| `element.parentNode` | Родительский элемент |
| `element.querySelector(sel)` | Найти один дочерний элемент |
| `element.offsetTop` | Позиция элемента от верха страницы |
| `window.pageYOffset` | Сколько пикселей прокручено |
| `classList.contains('x')` | Проверить наличие класса |
| `body.style.overflow = 'hidden'` | Заблокировать прокрутку |
| `element.disabled = true` | Заблокировать кнопку |
| `date.toLocaleDateString(locale)` | Форматировать дату по локали |
| `obj[variable]` | Доступ к свойству объекта через переменную |

---

## ❓ Вопросы с защиты

**Q: Зачем двойной setTimeout в showNotification?**
A: Первый setTimeout ждёт duration (3 секунды), потом запускает анимацию. Второй ждёт 300мс пока анимация проиграет, потом удаляет элемент. Нельзя удалить сразу — пользователь не увидит анимацию исчезновения.

**Q: Как работает подсветка активного пункта навигации при прокрутке?**
A: window.addEventListener('scroll') срабатывает при каждом движении. Перебираем все секции, проверяем offsetTop каждой. Если прокрутили >= начало секции-150px — эта секция текущая. Активируем соответствующую ссылку.

**Q: Почему модал показывается через CSS класс, а не style.display?**
A: Разделение ответственности. CSS управляет внешним видом — там анимации, transitions. JS только добавляет/убирает класс. Это чище и позволяет добавить анимацию в CSS без изменения JS.

**Q: Зачем document.body.style.overflow = 'hidden' при открытии модала?**
A: Когда модальное окно открыто — фон не должен прокручиваться. overflow:hidden на body блокирует прокрутку страницы. При закрытии возвращаем обратно.

**Q: Что такое querySelectorAll и чем отличается от getElementById?**
A: getElementById ищет один элемент по id (всегда уникальный). querySelectorAll ищет ВСЕ элементы по CSS селектору — классу, тегу, атрибуту. Возвращает NodeList (похож на массив).
