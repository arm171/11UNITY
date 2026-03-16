# 🔄 Что происходит когда нажимаешь кнопку
## Полный путь от клика до результата

---

## Главный принцип

Когда пользователь нажимает кнопку — информация проходит **7 уровней**:

```
1. HTML    → браузер знает что нажали
2. JS      → собирает данные, вызывает API
3. HTTP    → запрос летит по сети к серверу
4. Express → принимает запрос, направляет к нужному коду
5. Middleware → проверяет права (кто ты?)
6. Controller → бизнес-логика + SQL запрос к БД
7. БД      → сохраняет/возвращает данные
   ↕ (ответ идёт обратно по той же цепочке)
```

---

## Пример 1: Создание турнира

### Шаги по уровням:

**[HTML]** Есть кнопка:
```html
<button id="create-tournament-btn">Create Tournament</button>
```

**[JS — tournaments.js]** Слушает клик:
```js
document.getElementById('create-tournament-btn')
    .addEventListener('click', () => {
        UI.openModal('create-tournament-modal');
    });
```

**[JS — tournaments.js]** После заполнения формы и Submit:
```js
const data = {
    name: document.getElementById('tournament-name').value,
    type: document.getElementById('tournament-type').value,
    // ...
};
const response = await API.request('/tournaments', 'POST', data);
```

**[JS — api.js]** Делает HTTP запрос:
```js
fetch('http://localhost:3000/api/tournaments', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'  // JWT токен
    },
    body: JSON.stringify(data)
})
```

**[Backend — server.js]** Express получает запрос:
```js
app.use('/api/tournaments', tournamentRoutes);  // направляет к маршрутам
```

**[Backend — routes/tournaments.js]** Маршрутизация:
```js
router.post('/', auth, authorize('organizer'), controller.create);
//                ↑         ↑                  ↑
//           проверить    только               создать
//           JWT токен  organizer              турнир
```

**[Backend — middleware/auth.js]** Проверяет токен:
```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;  // теперь все знают кто это
```

**[Backend — tournamentController.js]** Бизнес-логика:
```js
const [result] = await db.execute(
    'INSERT INTO tournaments (name, type, ...) VALUES (?, ?, ...)',
    [name, type, ...]
);
res.json({ success: true, tournament: { id: result.insertId, ... } });
```

**[MySQL]** Сохраняет строку в таблицу `tournaments`.

**[Обратно — api.js]** Получает ответ:
```js
const data = await response.json();
// data = { success: true, tournament: { id: 42, name: "...", ... } }
```

**[JS — tournaments.js]** Обновляет страницу:
```js
UI.closeModal('create-tournament-modal');
UI.showToast('Tournament created!', 'success');
this.load();  // перезагружает список турниров
```

**[Socket.IO]** Уведомляет других пользователей онлайн:
```js
io.emit('tournament_created', { tournament });
// другие браузеры получают это и перезагружают список
```

---

## Пример 2: Вход в аккаунт (Login)

```
ПОЛЬЗОВАТЕЛЬ вводит email + пароль → нажимает Login
         │
         ▼
auth.js → собирает данные из формы
API.request('/auth/login', 'POST', { email, password })
         │
         ▼ (HTTP POST запрос)
         │
routes/auth.js → loginLimiter (макс 5 попыток в минуту) → authController.login
         │
authController.js:
  1. Ищет пользователя: SELECT * FROM users WHERE email = ?
  2. Проверяет пароль: bcrypt.compare(password, user.password)
  3. Создаёт JWT: jwt.sign({ id, role }, SECRET, { expiresIn: '24h' })
  4. Возвращает: { success: true, token: "eyJ...", user: {...} }
         │
         ▼ (ответ в браузер)
         │
auth.js:
  - сохраняет токен: localStorage.setItem('token', token)
  - сохраняет пользователя: localStorage.setItem('user', JSON.stringify(user))
  - обновляет UI: показывает имя, роль, кнопку logout
  - показывает профиль: скрывает hero-section, показывает profile-section
```

---

## Пример 3: Загрузка страницы (первый визит)

```
Пользователь открывает http://127.0.0.1:5500/frontend/index.html
         │
         ▼
Браузер загружает HTML (index.html)
         │
         ▼
Браузер загружает CSS файлы (reset → variables → components → main)
         │
         ▼
Браузер загружает JS файлы по порядку:
  config.js → i18n.js → en.js → ru.js → hy.js → ge.js →
  api.js → websocket.js → auth.js → ui.js →
  tournaments.js → teams.js → matches.js → statistics.js → main.js
         │
         ▼
main.js — вызывает App.init()
App.init():
  1. Auth.init()          → проверяет localStorage на токен
  2. I18n.init()          → применяет язык (по умолчанию 'en')
  3. Tournaments.init()   → загружает список турниров
  4. Teams.init()         → загружает список команд
  5. Matches.init()       → загружает матчи
  6. Statistics.init()    → загружает статистику
  7. WebSocket.init()     → устанавливает Socket.IO соединение
  8. настраивает навигацию (клики по пунктам меню)
```

---

## Пример 4: Переключение языка

```
Пользователь нажимает кнопку RU
         │
         ▼
i18n.js — слушает клик, читает data-lang="ru"
i18n.setLanguage('ru'):
  1. сохраняет: localStorage.setItem('language', 'ru')
  2. берёт переводы: const translations = I18n.translations['ru']
  3. находит все элементы: document.querySelectorAll('[data-i18n]')
  4. для каждого: element.textContent = translations[key]
  5. генерирует событие: window.dispatchEvent(new Event('languageChanged'))
         │
         ▼
Все модули слушают languageChanged:
  Statistics.render()    → перерисовывает с новым языком
  Tournaments.render()   → перерисовывает
  (и т.д.)
```

---

## Пример 5: Реалтайм обновление счёта матча

```
ОРГАНИЗАТОР вводит счёт 2:1 → Submit
         │
         ▼
matchController.updateScore():
  1. UPDATE matches SET team1_score=2, team2_score=1 WHERE id=?
  2. updateStandings()  → пересчитывает таблицу standings
  3. updatePlayerStats() → обновляет статистику игроков
  4. io.emit('score_updated', matchData)   ← Socket.IO событие
         │
         ▼ (WebSocket, не HTTP!)
         │
ДРУГИЕ ПОЛЬЗОВАТЕЛИ получают событие мгновенно:
websocket.js слушает 'score_updated':
  - находит матч в DOM
  - обновляет счёт без перезагрузки страницы
  - показывает анимацию "Score updated"
```

---

## Схема потока данных (рисунок для бумаги)

```
┌─────────────────────────────────────────────────────────────┐
│                        БРАУЗЕР                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  index   │    │   CSS    │    │    JS    │               │
│  │  .html   │◄──►│  файлы  │    │  модули  │               │
│  └──────────┘    └──────────┘    └────┬─────┘               │
│                                       │                      │
│                              localStorage                    │
│                           (token, user, lang)               │
└───────────────────────────────────────┼─────────────────────┘
                                        │ HTTP (fetch)
                                        │ WebSocket (io)
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        СЕРВЕР (порт 3000)                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ server   │───►│  routes  │───►│controller│               │
│  │  .js     │    │ (URL map)│    │ (логика) │               │
│  └──────────┘    └──────────┘    └────┬─────┘               │
│                                       │ SQL запросы         │
│                              ┌────────▼──────┐              │
│                              │  emailService │              │
│                              │fixturesGen... │              │
└───────────────────────────────────────────────┼─────────────┘
                                                │ SQL
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     MySQL База данных                        │
│  users │ teams │ tournaments │ matches │ standings │ ...     │
└─────────────────────────────────────────────────────────────┘
```

---

## Вопросы с защиты

**Q: Что происходит при нажатии кнопки Login?**
A: JS собирает email и пароль → отправляет POST /api/auth/login → сервер проверяет email в БД → bcrypt сравнивает пароль с хешем → если верно, создаёт JWT токен → отправляет токен клиенту → JS сохраняет в localStorage → обновляет UI.

**Q: Как сервер знает что пользователь авторизован?**
A: При каждом запросе к защищённым маршрутам frontend отправляет заголовок Authorization: Bearer TOKEN. Middleware auth.js извлекает токен, проверяет подпись через jwt.verify(). Если подпись верна — значит токен выдан нашим сервером. Из токена читаем id и роль пользователя.

**Q: Почему localStorage а не cookie?**
A: Для упрощения. localStorage доступен только из JS этого домена. В production лучше httpOnly cookie (JS не может читать — защита от XSS), но для диплома localStorage достаточно.

**Q: Как работает реалтайм обновление?**
A: Socket.IO создаёт постоянное соединение (WebSocket) между браузером и сервером. Когда счёт меняется — сервер делает `io.emit('score_updated', data)`. Все подключённые браузеры мгновенно получают это событие и обновляют UI без перезагрузки страницы.

**Q: Что такое middleware?**
A: Функция которая выполняется между получением запроса и отправкой ответа. Как охранник на входе. В нашем случае middleware auth.js проверяет токен. Если неверный — возвращает 401 и контроллер не вызывается.
