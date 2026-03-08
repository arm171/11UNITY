# 📁 Файл: frontend/js/main.js

## Что это такое?
Это точка входа frontend'а — первый файл который выполняет реальную работу.
Загружается последним из всех JS файлов. Запускает все модули по порядку.

Как server.js для backend — main.js для frontend.

---

## БЛОК 1: DOMContentLoaded — ждём загрузки HTML

```js
document.addEventListener('DOMContentLoaded', function() {
    // весь код запуска здесь
});
```

**`DOMContentLoaded`** — событие браузера. Срабатывает когда:
- HTML полностью загружен и разобран
- Все скрипты выполнены
- DOM готов (можно искать элементы)

Без этого: JS запустится раньше чем HTML готов → `getElementById()` вернёт null.

**`document.addEventListener(событие, функция)`** — подписаться на событие.
Когда событие произойдёт — функция выполнится.

---

## БЛОК 2: Проверка зависимостей

```js
if (!window.CONFIG) {
    console.error('CONFIG not loaded!');
    return;  // остановить выполнение если модуль не загружен
}
if (!window.I18n) { ... }
if (!window.API) { ... }
if (!window.UI) { ... }
// ... и так для всех модулей
```

Проверяем что все нужные модули загружены прежде чем запускать.
`window.CONFIG` — если config.js загружен, это значение будет объектом (truthy).
Если не загружен — будет `undefined` (falsy) → `!undefined = true` → ошибка.

---

## БЛОК 3: Инициализация модулей

```js
try {
    I18n.init();          // 1. Сначала переводы
    UI.init();            // 2. Интерфейс
    Auth.init();          // 3. Авторизация
    Tournaments.init();   // 4. Турниры
    Teams.init();         // 5. Команды
    Matches.init();       // 6. Матчи
    Statistics.init();    // 7. Статистика
    WebSocketManager.init(); // 8. WebSocket
} catch (error) {
    console.error('Initialization failed:', error);
    alert('Failed to initialize. Please refresh.');
}
```

Порядок важен:
- `I18n.init()` первым — UI использует переводы
- `Auth.init()` до остальных — они проверяют авторизацию

Каждый `.init()` — это функция внутри модуля которая:
- Вешает обработчики событий (клики, формы)
- Загружает данные с сервера
- Отрисовывает начальный UI

---

## БЛОК 4: Приветствие новому пользователю

```js
const hasVisited = localStorage.getItem('11unity_visited');
if (!hasVisited) {
    setTimeout(() => {
        UI.showNotification(I18n.t('welcome'), 'success', 4000);
        localStorage.setItem('11unity_visited', 'true');
    }, 1000);
}
```

`localStorage.getItem('11unity_visited')` — проверяем был ли здесь раньше.
Первый визит → показываем приветствие через 1 секунду → запоминаем что был.

**`setTimeout(функция, миллисекунды)`** — выполнить функцию через N мс:
```js
setTimeout(() => {
    console.log('Прошла секунда!')
}, 1000);  // 1000 мс = 1 секунда
```
Не блокирует выполнение! Код после setTimeout продолжает выполняться немедленно.

---

## БЛОК 5: Событие смены языка

```js
window.addEventListener('languageChanged', function() {
    if (window.Tournaments && Tournaments.render) Tournaments.render();
    if (window.Teams && Teams.render) Teams.render();
    if (window.Matches && Matches.render) Matches.render();
    if (window.Statistics && Statistics.render) Statistics.render();
});
```

Когда пользователь меняет язык → i18n.js генерирует событие `languageChanged`.
main.js его слушает и перерисовывает все секции на новом языке.

**Кастомное событие:**
```js
// i18n.js генерирует:
window.dispatchEvent(new Event('languageChanged'));

// main.js слушает:
window.addEventListener('languageChanged', callback);
```

**`window.Tournaments && Tournaments.render`** — двойная проверка:
1. `window.Tournaments` — модуль загружен?
2. `Tournaments.render` — метод render существует?
Только если оба true — вызываем render().

---

## БЛОК 6: Глобальные обработчики ошибок

```js
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});
```

**`error`** — ловит обычные JS ошибки (ReferenceError, TypeError и т.д.)
**`unhandledrejection`** — ловит Promise которые упали без catch:
```js
// Без catch — попадёт в unhandledrejection:
fetch('/api/data')  // если упадёт — никто не поймает

// Правильно — с catch:
fetch('/api/data').catch(err => console.error(err))
```

---

## БЛОК 7: window.debug — инструмент разработчика

```js
window.debug = {
    config: CONFIG,
    api: API,

    login: (email, password) => API.login({ email, password }),
    logout: () => { API.logout(); Auth.updateUI(); },
    getUser: () => API.getUser(),
    getTournaments: () => Tournaments.tournaments,
    clearStorage: () => { localStorage.clear(); location.reload(); },
};
```

Это утилиты для отладки в консоли браузера. Открываешь DevTools → Console и пишешь:
```js
debug.getUser()           // посмотреть текущего пользователя
debug.getTournaments()    // посмотреть загруженные турниры
debug.clearStorage()      // очистить всё и перезагрузить
debug.login('a@a.com', '123456')  // войти прямо из консоли
```

`location.reload()` — перезагрузить страницу.

---

## 📊 Полная последовательность запуска

```
Браузер загружает index.html
    ↓
Загружает CSS файлы
    ↓
Загружает JS файлы по порядку:
config.js → i18n.js → локали → api.js → websocket.js
→ auth.js → ui.js → tournaments.js → teams.js
→ matches.js → statistics.js → main.js
    ↓
DOMContentLoaded срабатывает
    ↓
main.js: проверяет все модули
    ↓
I18n.init()  → загружает язык из localStorage, переводит статичный текст
UI.init()    → вешает обработчики навигации, кнопок
Auth.init()  → проверяет токен в localStorage, обновляет UI
Tournaments.init() → загружает турниры с сервера, отрисовывает
Teams.init() → загружает команды с сервера, отрисовывает
Matches.init() → загружает матчи с сервера, отрисовывает
Statistics.init() → загружает статистику
WebSocketManager.init() → подключается к Socket.IO
    ↓
Сайт готов к работе!
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `DOMContentLoaded` | Событие: HTML готов, можно работать с DOM |
| `document.addEventListener` | Подписаться на событие документа |
| `window.addEventListener` | Подписаться на событие окна браузера |
| `setTimeout(fn, ms)` | Выполнить функцию через N миллисекунд |
| `try/catch` | Поймать ошибку при инициализации |
| `window.dispatchEvent` | Генерировать кастомное событие |
| `new Event('name')` | Создать кастомное событие |
| `location.reload()` | Перезагрузить страницу |
| `localStorage.clear()` | Удалить все данные из localStorage |
| `a && b` | Выполнить b только если a истинно |

---

## ❓ Вопросы с защиты

**Q: Зачем DOMContentLoaded?**
A: Гарантирует что HTML полностью загружен перед выполнением JS. Без этого getElementById() вернёт null если элемент ещё не загружен.

**Q: Почему main.js последний в списке скриптов?**
A: Он вызывает функции из ВСЕХ других модулей (I18n.init, Auth.init и т.д.). Если загрузить раньше — эти объекты ещё не существуют.

**Q: Зачем проверять зависимости в начале?**
A: Защита от ошибок. Если один файл не загрузился (ошибка сети) — лучше вывести понятное сообщение в консоль, чем непонятный crash в середине инициализации.

**Q: Что такое кастомное событие languageChanged?**
A: i18n.js генерирует это событие через dispatchEvent когда язык меняется. main.js его слушает и перерисовывает все секции. Это паттерн "событие-подписчик" (observer pattern) — модули общаются через события не напрямую.

**Q: Зачем window.debug?**
A: Инструмент разработки. В консоли браузера можно быстро тестировать функции без UI. debug.clearStorage() очень полезен при разработке — сбрасывает авторизацию и перезагружает.
