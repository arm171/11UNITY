# 📁 Файлы: frontend/js/config.js + frontend/js/api.js

---

# ЧАСТЬ 1: config.js — настройки frontend'а

## Что это такое?
Это файл конфигурации для frontend части. Хранит все настройки в одном месте.
Как .env для backend — только для браузера.

## Разбор объекта CONFIG:

```js
const CONFIG = {
    API_URL: 'http://localhost:3000/api',  // адрес нашего сервера
    WS_URL: 'http://localhost:3000',       // адрес для WebSocket

    ENDPOINTS: {                           // все адреса API
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        TOURNAMENTS: '/tournaments',
        TOURNAMENT_BY_ID: '/tournaments/:id',  // :id — placeholder
        TEAMS: '/teams',
        ...
    },

    STORAGE: {                             // ключи для localStorage
        TOKEN: '11unity_token',
        USER: '11unity_user',
    },

    ROLES: {                               // роли пользователей
        PLAYER: 'player',
        COACH: 'coach',
        ORGANIZER: 'organizer',
    },

    TOURNAMENT_TYPES: { ... },
    TOURNAMENT_STATUS: { ... },
};

window.CONFIG = CONFIG;  // делаем глобальной переменной
```

**`window.CONFIG = CONFIG`** — в браузере `window` это глобальный объект.
Всё что кладём в window — доступно из любого JS файла на странице.
Поэтому в api.js можно писать просто `CONFIG.API_URL` без импорта.

**Зачем константы вместо строк напрямую?**
Плохо:
```js
fetch('http://localhost:3000/api/auth/login')  // строка повторяется везде
```
Хорошо:
```js
fetch(CONFIG.API_URL + CONFIG.ENDPOINTS.LOGIN)  // изменить один раз в config
```
Если сменим порт — меняем только в config.js, не ищем по всему коду.

---

# ЧАСТЬ 2: api.js — все HTTP запросы

## Что это такое?
Один объект API со всеми методами для общения с сервером.
Это паттерн "сервисный слой" — весь сетевой код в одном месте.

```js
const API = {
    // методы...
};
window.API = API;
```

---

## ГРУППА 1: localStorage — хранение токена

```js
getToken() {
    return localStorage.getItem(CONFIG.STORAGE.TOKEN);
    // читает '11unity_token' из localStorage
},

setToken(token) {
    localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
    // сохраняет токен
},

removeToken() {
    localStorage.removeItem(CONFIG.STORAGE.TOKEN);
    // удаляет токен (при выходе)
},
```

**Что такое localStorage?**
Это хранилище в браузере. Данные сохраняются даже после закрытия вкладки.
```
localStorage.setItem('ключ', 'значение')  → сохранить
localStorage.getItem('ключ')              → прочитать (или null)
localStorage.removeItem('ключ')           → удалить
```
Именно там хранится JWT токен — поэтому после закрытия и открытия браузера ты всё ещё залогинен!

**Работа с объектами в localStorage:**
```js
// Объект нельзя хранить напрямую — только строки!
setUser(user) {
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    // JSON.stringify({id:1, name:'Arman'}) → '{"id":1,"name":"Arman"}'
},

getUser() {
    const userStr = localStorage.getItem(CONFIG.STORAGE.USER);
    return userStr ? JSON.parse(userStr) : null;
    // JSON.parse('{"id":1}') → {id:1, name:'Arman'}
}
```

**`JSON.stringify(obj)`** — объект → строка (для сохранения)
**`JSON.parse(str)`** — строка → объект (для чтения)

**`isAuthenticated()`:**
```js
isAuthenticated() {
    return !!this.getToken();
    // !! = двойное отрицание = преобразовать в boolean
    // getToken() вернёт строку токена или null
    // !null = true, !!null = false
    // !"eyJhbG..." = false, !!"eyJhbG..." = true
},
```

---

## ГРУППА 2: request() — главная функция запросов

Это сердце всего API модуля. Все остальные методы вызывают именно её.

```js
async request(endpoint, options = {}) {
    // Шаг 1: Составить полный URL
    const url = CONFIG.API_URL + endpoint;
    // 'http://localhost:3000/api' + '/tournaments' = 'http://localhost:3000/api/tournaments'

    // Шаг 2: Подготовить заголовки
    const headers = {
        'Content-Type': 'application/json',  // отправляем JSON
        ...options.headers,                   // spread: добавить кастомные заголовки если есть
    };

    // Шаг 3: Добавить токен если есть
    const token = this.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // сервер увидит: Authorization: Bearer eyJhbGci...
    }

    // Шаг 4: Собрать конфиг запроса
    const config = {
        ...options,   // метод (GET/POST/...), body и т.д.
        headers,      // заголовки
    };

    // Шаг 5: Выполнить запрос
    try {
        const response = await fetch(url, config);

        // Шаг 6: Проверить статус
        if (!response.ok) {                         // ok = статус 200-299
            const error = await response.json();    // прочитать сообщение ошибки
            throw new Error(error.message || 'Request failed');
        }

        // Шаг 7: Вернуть данные
        const data = await response.json();  // распарсить JSON ответ
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;  // пробросить ошибку выше
    }
},
```

### Что такое fetch()?
`fetch` — встроенная браузерная функция для HTTP запросов.
```js
fetch(url, options)
// url — адрес
// options — метод, заголовки, тело
// возвращает Promise с Response объектом
```

### Spread в объектах `...options`:
```js
const config = {
    ...options,   // если options = { method: 'POST', body: '{}' }
    headers,      // добавляем headers
};
// результат: { method: 'POST', body: '{}', headers: {...} }
```
Копирует все свойства options в новый объект и добавляет headers.

### `response.ok`:
- `true` если статус 200-299 (успех)
- `false` если 400, 401, 403, 404, 500 и т.д.

### `throw new Error()`:
```js
throw new Error('сообщение')  // выбросить ошибку — выполнение функции останавливается
// catch снаружи поймает эту ошибку
```

---

## ГРУППА 3: Auth методы

```js
async register(userData) {
    const response = await this.request(CONFIG.ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),   // объект → JSON строка
    });

    if (response.token) {
        this.setToken(response.token);    // сохранить токен
        this.setUser(response.user);      // сохранить данные пользователя
    }

    return response;
},

async login(credentials) { /* то же самое */ },

logout() {
    this.removeToken();   // удалить токен
    this.removeUser();    // удалить данные пользователя
},
```

---

## ГРУППА 4: Tournament, Team, Match методы — паттерн

Все методы построены по одному шаблону. Пример:

```js
// GET запрос (без body):
async getTournaments() {
    return await this.request(CONFIG.ENDPOINTS.TOURNAMENTS);
    // GET http://localhost:3000/api/tournaments
},

// GET с ID (подставляем :id):
async getTournamentById(id) {
    const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
    // '/tournaments/:id'.replace(':id', 5) → '/tournaments/5'
    return await this.request(endpoint);
},

// POST запрос (с body):
async createTournament(tournamentData) {
    return await this.request(CONFIG.ENDPOINTS.TOURNAMENTS, {
        method: 'POST',
        body: JSON.stringify(tournamentData),
    });
},

// PUT запрос (обновить):
async updateTournament(id, tournamentData) {
    const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
    return await this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(tournamentData),
    });
},

// DELETE запрос:
async deleteTournament(id) {
    const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
    return await this.request(endpoint, {
        method: 'DELETE',
    });
},
```

**`.replace(':id', id)`** — заменить `:id` на реальное число:
```js
'/tournaments/:id'.replace(':id', 42)  → '/tournaments/42'
```

---

## СПЕЦИАЛЬНЫЙ МЕТОД: searchPlayers

```js
async searchPlayers(teamId, query) {
    const endpoint = `/teams/${teamId}/players/search?query=${encodeURIComponent(query)}`;
    return await this.request(endpoint);
},
```

**`encodeURIComponent(query)`** — закодировать строку для URL:
```js
encodeURIComponent('Иван Иванов')  → 'Ivan%20Ivanov'
encodeURIComponent('FC Real')      → 'FC%20Real'
```
Пробелы и спецсимволы нельзя использовать в URL напрямую — кодируем.

---

## 📊 Как работает цепочка запроса

```
Пользователь нажал "Создать команду"
            ↓
teams.js:  API.createTeam({ name: 'FC Test', logoColor: '#ff0000' })
            ↓
api.js:    this.request('/teams', { method: 'POST', body: '{"name":"FC Test",...}' })
            ↓
           url = 'http://localhost:3000/api/teams'
           headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer eyJ...' }
            ↓
           fetch(url, { method: 'POST', headers, body })
            ↓
СЕРВЕР → routes/teams.js → teamController.createTeam
            ↓
           response = { success: true, team: { id: 5, name: 'FC Test' } }
            ↓
api.js:    return data  (объект с командой)
            ↓
teams.js:  обрабатывает результат, обновляет UI
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `window.X = X` | Сделать переменную глобальной в браузере |
| `localStorage.getItem/setItem/removeItem` | Хранилище в браузере (сохраняется после закрытия) |
| `JSON.stringify(obj)` | Объект → JSON строка |
| `JSON.parse(str)` | JSON строка → объект |
| `!!value` | Двойное отрицание → boolean (true/false) |
| `fetch(url, options)` | HTTP запрос из браузера |
| `response.ok` | true если статус 200-299 |
| `response.json()` | Прочитать JSON ответ (async) |
| `throw new Error('msg')` | Выбросить ошибку |
| `{...obj1, ...obj2}` | Spread в объектах — слить два объекта |
| `.replace(':id', id)` | Подставить значение в строку |
| `encodeURIComponent()` | Закодировать строку для использования в URL |
| `this` | Ссылка на текущий объект (внутри метода объекта) |
| `options = {}` | Параметр по умолчанию — если не передан, будет {} |

---

## ❓ Вопросы с защиты

**Q: Зачем все API методы в одном объекте?**
A: Паттерн "сервисный слой". Весь сетевой код в одном месте. Легко найти, легко изменить. Если поменяем сервер — меняем только api.js, не ищем fetch() по всему коду.

**Q: Почему токен хранится в localStorage а не в cookie?**
A: Для простоты. localStorage проще в работе с JS. Cookie требует больше настроек (httpOnly, secure). Для дипломного проекта localStorage достаточно.

**Q: Как токен попадает в каждый запрос автоматически?**
A: В функции request() перед каждым fetch: `if (token) headers['Authorization'] = 'Bearer ' + token`. Все методы вызывают request() — значит токен добавляется везде автоматически.

**Q: Что такое fetch?**
A: Встроенная браузерная функция для HTTP запросов. Возвращает Promise. Заменила старый XMLHttpRequest. Используется с await для удобного синхронного стиля.

**Q: Зачем JSON.stringify при отправке и JSON.parse при получении?**
A: HTTP передаёт только текст. JavaScript объект нельзя передать напрямую — нужно преобразовать в строку (stringify). При получении строка обратно в объект (parse). Сервер делает то же самое.

**Q: Что такое encodeURIComponent?**
A: Функция кодирования для URL. Пробелы → %20, специальные символы экранируются. Без этого URL будет неверным. Пример: "FC Real" → "FC%20Real".
