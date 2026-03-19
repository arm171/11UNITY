# 11UNITY — ПОЛНОЕ РУКОВОДСТВО ДЛЯ ЗАЩИТЫ ДИПЛОМА

> Этот документ объясняет ВСЁ о проекте: инструменты, файловую структуру, базу данных,
> и каждый раздел сайта — подробно, с указанием где в коде это написано.

---

# ЧАСТЬ 1 — ИНСТРУМЕНТЫ И ТЕХНОЛОГИИ

## 1.1 Node.js

**Что это такое:**
Node.js — это среда выполнения JavaScript на сервере. До Node.js JavaScript работал только в браузере. Node.js позволяет запускать JavaScript-код прямо на компьютере / сервере, без браузера.

**Как работает внутри:**
Node.js построен на движке V8 (тот же движок, что используется в браузере Chrome). V8 компилирует JavaScript в машинный код — поэтому Node.js работает очень быстро. Главная особенность — асинхронная, событийно-ориентированная модель (event-driven, non-blocking I/O). Это означает, что когда Node.js ждёт ответа от базы данных, он не блокирует весь поток — он продолжает принимать другие запросы. Это позволяет обслуживать сотни пользователей одновременно на одном потоке.

**Как связано с нашим проектом:**
Весь наш backend (серверная часть) написан на Node.js. Файл `backend/server.js` — это точка запуска всего сервера. Когда мы пишем `node server.js`, Node.js читает этот файл и запускает наш сервер.

---

## 1.2 Express.js

**Что это такое:**
Express.js — это фреймворк для Node.js. Если Node.js — это "сырой" двигатель автомобиля, то Express.js — это весь кузов, руль и педали. Он добавляет удобные инструменты для создания HTTP-сервера: маршруты, middleware, обработку запросов и ответов.

**Как работает внутри:**
Express.js работает через систему middleware — это функции, которые выполняются последовательно при каждом HTTP-запросе. Каждая middleware получает объект запроса (req), объект ответа (res) и функцию next() для передачи управления дальше. Порядок middleware важен — они выполняются строго сверху вниз в том порядке, в котором добавлены через `app.use()`.

**Как связано с нашим проектом:**

В файле `backend/server.js`:
```javascript
const app = express();
app.use(cors());           // middleware для CORS
app.use(express.json());   // middleware для чтения JSON из тела запроса
app.use('/api/auth', authRoutes);        // маршрут для аутентификации
app.use('/api/tournaments', tournamentRoutes);  // маршрут для турниров
```

Express принимает запрос от браузера, проверяет URL, находит нужный маршрут и вызывает соответствующую функцию-контроллер.

---

## 1.3 MySQL и mysql2

**Что это такое:**
MySQL — реляционная система управления базами данных (СУБД). Данные хранятся в таблицах со строками и столбцами (как Excel), а таблицы связаны между собой через ключи. `mysql2` — это Node.js-пакет (библиотека), который позволяет Node.js подключаться к MySQL и выполнять SQL-запросы.

**Почему реляционная БД, а не NoSQL (MongoDB):**
В нашем проекте данные сильно связаны между собой: игрок принадлежит команде, команда участвует в турнире, турнир содержит матчи, матчи генерируют события. Реляционная модель с Foreign Keys гарантирует целостность данных — нельзя создать матч для несуществующего турнира. MySQL поддерживает ACID-транзакции, что важно при одновременном вводе результатов несколькими пользователями.

**Connection Pool:**
Вместо того, чтобы каждый раз создавать новое подключение к БД (что медленно), мы используем пул соединений — заранее созданный набор готовых подключений. Когда приходит запрос, берётся свободное подключение из пула, используется, и возвращается обратно.

В файле `backend/config/database.js`:
```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10  // максимум 10 одновременных подключений
});
```

---

## 1.4 bcrypt (bcryptjs)

**Что это такое:**
bcrypt — алгоритм одностороннего хеширования паролей. "Одностороннее" означает, что из хеша невозможно восстановить исходный пароль. Это математически доказанный факт.

**Как работает внутри:**
1. При хешировании bcrypt добавляет к паролю случайную строку (salt) — поэтому одинаковые пароли дают разные хеши.
2. Затем выполняет вычислительно сложную операцию (10 rounds по умолчанию) — на каждый раунд время удваивается, что делает перебор паролей крайне медленным.
3. При проверке берётся введённый пароль и тот же salt из сохранённого хеша, проводится та же операция, и результаты сравниваются.

**Как связано с нашим проектом:**

В файле `backend/controllers/authController.js`:
```javascript
// При регистрации — хешируем пароль:
const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds

// При входе — проверяем пароль:
const isPasswordValid = await bcrypt.compare(password, user.password);
```

Пароли в базе данных хранятся в виде строки типа: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy` — это и есть bcrypt-хеш. Настоящий пароль нигде не сохраняется.

---

## 1.5 JWT (JSON Web Token) — jsonwebtoken

**Что это такое:**
JWT — стандарт для создания токенов доступа. Токен — это строка, которая содержит зашифрованную информацию о пользователе и подтверждает, что он авторизован.

**Структура JWT:**
JWT состоит из трёх частей, разделённых точками: `header.payload.signature`
- **Header** — тип токена и алгоритм подписи (Base64)
- **Payload** — данные (userId, email, role, expiration) (Base64)
- **Signature** — цифровая подпись, создаётся из header + payload + секретный ключ

**Как работает в нашем проекте:**

1. Пользователь входит → сервер создаёт токен:
```javascript
// backend/controllers/authController.js
const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,  // секретный ключ из .env
    { expiresIn: '7d' }      // токен действует 7 дней
);
```

2. Браузер сохраняет токен в localStorage под ключом `11unity_token`.

3. При каждом запросе к защищённому API токен отправляется в заголовке:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

4. Middleware на сервере проверяет токен:
```javascript
// backend/middleware/auth.js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // { id, email, role }
```

**Почему JWT, а не сессии:**
JWT — stateless. Сервер не хранит никаких данных о сессиях — вся информация внутри самого токена. Это позволяет масштабировать систему горизонтально (несколько серверов).

---

## 1.6 Socket.IO (WebSocket)

**Что это такое:**
Socket.IO — библиотека для двусторонней связи в реальном времени между сервером и браузером. Строится поверх протокола WebSocket.

**Разница HTTP vs WebSocket:**
- **HTTP**: запрос → ответ → соединение закрывается. Браузер должен сам запрашивать обновления.
- **WebSocket**: устанавливается постоянное соединение. Сервер САМ отправляет данные браузеру в любой момент без запроса.

**Как работает в нашем проекте:**
Когда организатор вводит результат матча:
1. Сервер сохраняет результат в БД.
2. Сервер через Socket.IO отправляет событие `match:score-update` всем, кто смотрит этот турнир.
3. Браузеры получают событие и автоматически обновляют счёт на экране — без перезагрузки страницы.

**Rooms (комнаты):**
Каждый турнир имеет свою "комнату". Пользователь, открывший страницу турнира, присоединяется к его комнате: `socket.emit('tournament:join', tournamentId)`. Обновления получают только пользователи в той же комнате.

Файл `frontend/js/websocket.js` — клиентская часть WebSocket.
Файл `backend/socket/socketHandler.js` — серверная часть.

---

## 1.7 dotenv

**Что это такое:**
dotenv — пакет для загрузки переменных окружения из файла `.env` в `process.env`. Это стандартный способ хранить секретные данные (пароли, ключи) отдельно от кода.

**Файл .env в проекте:**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=11UNITY_db
JWT_SECRET=your_secret_key
PORT=3000
```

Файл `.env` не загружается в git (добавлен в `.gitignore`) — это защищает секреты.

---

## 1.8 node-cron

**Что это такое:**
node-cron — планировщик задач для Node.js. Позволяет выполнять функции по расписанию (как cron в Linux).

**Как используется в нашем проекте:**

В файле `backend/server.js`:
```javascript
// Каждый день в полночь проверяем турниры
cron.schedule('0 0 * * *', checkAndActivateTournaments);
```

Функция `checkAndActivateTournaments` выполняет SQL-запрос:
```sql
UPDATE tournaments
SET status = 'active'
WHERE status = 'upcoming'
  AND start_date <= CURDATE()
```

Это означает: если дата начала турнира уже наступила, автоматически сменить статус с "upcoming" на "active". Также эта функция вызывается при каждом запуске сервера.

---

## 1.9 Nodemailer

**Что это такое:**
Nodemailer — пакет Node.js для отправки электронных писем через SMTP-протокол.

**Как используется в нашем проекте:**
- При регистрации — отправляет письмо с ссылкой для подтверждения email.
- При забытом пароле — отправляет ссылку для сброса пароля.

Файл: `backend/services/emailService.js`

---

## 1.10 express-rate-limit

**Что это такое:**
Middleware для ограничения количества запросов с одного IP-адреса за определённое время. Защищает от brute-force атак.

**Как используется в нашем проекте:**

В файле `backend/routes/auth.js`:
```javascript
// Максимум 5 попыток входа в минуту с одного IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 минута
    max: 5,
    message: 'Too many login attempts. Please try again in 1 minute.'
});

// Максимум 3 регистрации в час с одного IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
});
```

---

## 1.11 crypto (встроенный модуль Node.js)

**Что это такое:**
Встроенный модуль Node.js для криптографических операций. Нам нужна только одна функция — генерация случайных байт.

**Как используется:**
```javascript
// backend/controllers/authController.js
const verificationToken = crypto.randomBytes(32).toString('hex');
// Результат: случайная строка из 64 шестнадцатеричных символов
// Например: "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
```

Этот токен сохраняется в базе данных и отправляется в ссылке для верификации или сброса пароля.

---

## 1.12 CORS (cors)

**Что это такое:**
CORS (Cross-Origin Resource Sharing) — механизм безопасности браузера. По умолчанию браузер блокирует запросы с одного домена к другому. CORS middleware на сервере сообщает браузеру, каким доменам разрешено делать запросы.

**Как используется:**
```javascript
// backend/server.js
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Это нужно потому что frontend (порт 5500, Live Server) и backend (порт 3000, Node.js) работают на разных портах — для браузера это разные "источники" (origins).

---

## 1.13 Vanilla JavaScript (фронтенд)

**Что это такое:**
"Vanilla JS" означает чистый JavaScript без фреймворков (без React, Vue, Angular). Всё управление DOM, запросы к серверу, рендеринг данных — написано вручную.

**Почему Vanilla JS:**
Выбрано для демонстрации понимания фундаментальных основ JavaScript — работа с DOM API, Fetch API, localStorage, кастомные события, модульная архитектура через объекты.

**Ключевые API браузера которые используем:**
- `fetch()` — HTTP-запросы к backend
- `localStorage` — хранение токена и данных пользователя
- `document.createElement()` / `innerHTML` — создание HTML элементов
- `addEventListener()` — обработка событий
- `CustomEvent` — кастомные события между модулями

---

## 1.14 Алгоритм Round-Robin

**Что это такое:**
Алгоритм составления расписания, при котором каждая команда играет с каждой другой командой ровно один раз (одинарный круг) или дважды (двойной круг).

**Как работает математически:**
Для n команд:
- Количество туров = n-1 (если n чётное)
- Количество матчей в туре = n/2
- Если n нечётное — добавляется фиктивная команда BYE, тогда n становится чётным

Для каждого тура r и матча m:
- Индекс хозяина: `home = (r + m) % (n-1)`
- Индекс гостя: `away = (n - 1 - m + r) % (n-1)`
- Последняя команда всегда фиксирована (не вращается)

**Пример для 4 команд (A, B, C, D):**
- Тур 1: A-D, B-C
- Тур 2: A-C, D-B
- Тур 3: A-B, C-D

**В коде:** `backend/controllers/tournamentController.js` — функция `generateFixtures()`

---

## 1.15 Алгоритм Playoff (bracket)

**Что это такое:**
Турнир на выбывание. Проигравший выбывает из турнира. Победитель переходит в следующий раунд.

**Поле bracket_slot:**
Каждый матч имеет `bracket_slot` — позицию в сетке. Победитель матча с `bracket_slot=0` в следующем раунде встречается с победителем матча с `bracket_slot=1`. Это позволяет автоматически формировать следующий раунд.

**Для 8 команд:**
- Четвертьфинал: 4 матча (bracket_slot 0,1,2,3)
- Полуфинал: 2 матча (bracket_slot 0,1) — автоматически создаётся
- Финал: 1 матч — автоматически создаётся

---

# ЧАСТЬ 2 — СТРУКТУРА ФАЙЛОВ ПРОЕКТА

```
11UNITY/
├── backend/                    # Серверная часть (Node.js)
│   ├── server.js               # ТОЧКА ВХОДА — запуск всего сервера
│   ├── seed.js                 # Скрипт заполнения БД тестовыми данными
│   ├── .env                    # Секретные переменные (не в git!)
│   ├── package.json            # Список зависимостей npm
│   │
│   ├── config/
│   │   └── database.js         # Настройка подключения к MySQL (connection pool)
│   │
│   ├── controllers/            # Бизнес-логика (что делать с данными)
│   │   ├── authController.js   # Регистрация, вход, верификация email, сброс пароля
│   │   ├── teamController.js   # CRUD команд, управление игроками
│   │   └── tournamentController.js  # CRUD турниров, генерация расписания, управление матчами
│   │
│   ├── routes/                 # Маршруты API (какой URL → какой контроллер)
│   │   ├── auth.js             # POST /api/auth/register, /login, /verify/:token
│   │   ├── tournaments.js      # GET/POST/PUT/DELETE /api/tournaments/...
│   │   ├── teams.js            # GET/POST/PUT/DELETE /api/teams/...
│   │   ├── matches.js          # GET /api/matches (все матчи для страницы Matches)
│   │   ├── statistics.js       # GET /api/statistics (глобальная статистика)
│   │   ├── profile.js          # GET /api/profile/stats, PUT /api/profile/update
│   │   └── admin.js            # GET /api/admin/... (только для роли admin)
│   │
│   ├── middleware/
│   │   └── auth.js             # Проверка JWT токена на каждый запрос
│   │
│   ├── services/
│   │   └── emailService.js     # Отправка писем через Nodemailer
│   │
│   └── socket/
│       ├── socketHandler.js    # Инициализация Socket.IO сервера
│       └── tournamentSocket.js # Логика отправки WebSocket событий
│
├── frontend/                   # Клиентская часть (браузер)
│   ├── index.html              # ЕДИНСТВЕННЫЙ HTML ФАЙЛ — SPA (Single Page Application)
│   │
│   ├── js/                     # JavaScript модули
│   │   ├── config.js           # Константы: API URL, ключи localStorage, роли
│   │   ├── api.js              # Все HTTP-запросы к backend (fetch wrapper)
│   │   ├── i18n.js             # Система переводов (мультиязычность)
│   │   ├── ui.js               # Уведомления, модальные окна, спиннеры
│   │   ├── main.js             # Инициализация всех модулей (точка входа)
│   │   ├── auth.js             # Логика аутентификации и профиля
│   │   ├── tournaments.js      # Страница турниров
│   │   ├── teams.js            # Страница команд
│   │   ├── matches.js          # Страница матчей
│   │   ├── statistics.js       # Страница статистики
│   │   └── websocket.js        # WebSocket клиент (Socket.IO)
│   │
│   ├── css/
│   │   ├── main.css            # Основные стили (layout, navbar, hero)
│   │   └── components.css      # Стили компонентов (карточки, модалки, таблицы)
│   │
│   ├── locales/                # Файлы переводов
│   │   ├── en.js               # Английский
│   │   ├── ru.js               # Русский
│   │   ├── hy.js               # Армянский
│   │   └── ge.js               # Грузинский
│   │
│   └── img/
│       └── logo.png            # Логотип 11UNITY
│
└── study/                      # Материалы для подготовки к защите
    └── DIPLOMA_DEFENSE_GUIDE.md  # Этот документ
```

---

### Что находится в каждом ключевом файле:

**`backend/server.js`** — главный файл сервера:
- Создаёт Express приложение
- Настраивает все middleware (cors, json, логирование)
- Подключает все маршруты (`/api/auth`, `/api/tournaments` и т.д.)
- Инициализирует Socket.IO
- Запускает cron-задачу (авто-активация турниров)
- Запускает HTTP-сервер на порту 3000

**`backend/config/database.js`** — только одно: создаёт connection pool к MySQL и экспортирует его. Все остальные файлы делают `require('./config/database')` и используют этот pool.

**`backend/middleware/auth.js`** — проверяет JWT токен. Если токен неверный или просроченный — возвращает ошибку 401. Если всё хорошо — добавляет `req.user = { id, email, role }` и передаёт запрос дальше.

**`frontend/index.html`** — единственный HTML файл. Содержит все секции (home, tournaments, teams, matches, statistics) сразу, просто часть из них скрыта через CSS. Подключает все JS файлы в нужном порядке.

**`frontend/js/config.js`** — хранит все константы в одном месте: URL сервера, ключи localStorage, названия ролей, типы турниров. Если нужно изменить URL сервера — меняется только здесь.

**`frontend/js/api.js`** — обёртка над fetch(). Все запросы к серверу проходят через `API.request()`. Автоматически добавляет JWT токен в заголовок, обрабатывает ошибки. Не нужно в каждом месте кода вручную добавлять заголовки.

**`frontend/js/main.js`** — точка входа фронтенда. Ждёт загрузки DOM (`DOMContentLoaded`), затем инициализирует все модули в правильном порядке: I18n → UI → Auth → Tournaments → Teams → Matches → Statistics → WebSocketManager.

---

# ЧАСТЬ 3 — БАЗА ДАННЫХ

## 3.1 Схема — все таблицы

### Таблица `users` — пользователи
```
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(100)        — имя пользователя
email           VARCHAR(255) UNIQUE — email (логин)
password        VARCHAR(255)        — bcrypt-хеш пароля
role            ENUM('player','coach','organizer','admin')
is_verified     TINYINT(1) DEFAULT 0  — подтверждён email?
verification_token VARCHAR(255)     — токен верификации email
reset_token     VARCHAR(255)        — токен сброса пароля
reset_token_expires DATETIME        — срок действия токена сброса
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Таблица `teams` — команды
```
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(100) UNIQUE — название команды
logo            VARCHAR(10)         — аббревиатура (первые 3 буквы)
logo_color      VARCHAR(7)          — цвет логотипа (#RRGGBB)
description     TEXT
max_players     INT DEFAULT 25      — максимум игроков
coach_id        INT  → users.id     — FOREIGN KEY (тренер)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Таблица `team_players` — связь игроков с командами (Many-to-Many)
```
id              INT AUTO_INCREMENT PRIMARY KEY
team_id         INT  → teams.id     — FOREIGN KEY
player_id       INT  → users.id     — FOREIGN KEY
position        ENUM('goalkeeper','defender','midfielder','forward')
jersey_number   INT                 — номер майки
joined_at       TIMESTAMP
```

### Таблица `tournaments` — турниры
```
id              INT AUTO_INCREMENT PRIMARY KEY
name            VARCHAR(255) UNIQUE — название турнира
type            ENUM('league','playoff','group_playoff')
category        ENUM('school','university','amateur')
status          ENUM('upcoming','active','finished') DEFAULT 'upcoming'
start_date      DATE                — дата начала
location        VARCHAR(255)        — место проведения
description     TEXT
max_teams       INT                 — максимум команд (4/8/16/32)
min_players_per_team INT            — мин. игроков в команде (7/9/11)
organizer_id    INT  → users.id     — FOREIGN KEY (кто создал)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Таблица `tournament_teams` — заявки команд на турниры (Many-to-Many)
```
id              INT AUTO_INCREMENT PRIMARY KEY
tournament_id   INT  → tournaments.id  — FOREIGN KEY
team_id         INT  → teams.id        — FOREIGN KEY
status          ENUM('pending','approved','rejected') DEFAULT 'pending'
joined_at       TIMESTAMP
```

### Таблица `matches` — матчи
```
id              INT AUTO_INCREMENT PRIMARY KEY
tournament_id   INT  → tournaments.id  — FOREIGN KEY
team1_id        INT  → teams.id        — FOREIGN KEY (хозяева)
team2_id        INT  → teams.id        — FOREIGN KEY (гости)
round           VARCHAR(20)             — номер тура или 'SF','Final'
match_date      DATETIME                — дата и время
venue           VARCHAR(255)            — стадион
status          ENUM('scheduled','in_progress','finished')
team1_score     INT NULL                — NULL пока не сыгран
team2_score     INT NULL
bracket_slot    INT NULL                — позиция в плей-офф сетке
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Таблица `match_events` — события матча (голы, карточки)
```
id              INT AUTO_INCREMENT PRIMARY KEY
match_id        INT  → matches.id      — FOREIGN KEY
player_id       INT  → users.id        — FOREIGN KEY (кто сделал)
team_id         INT  → teams.id        — FOREIGN KEY (за какую команду)
event_type      ENUM('goal','yellow_card','red_card')
minute          INT                    — минута события
is_own_goal     TINYINT(1) DEFAULT 0  — автогол?
assist_player_id INT → users.id        — FOREIGN KEY (кто отдал пас)
description     TEXT
created_at      TIMESTAMP
```

### Таблица `standings` — турнирная таблица
```
id              INT AUTO_INCREMENT PRIMARY KEY
tournament_id   INT  → tournaments.id  — FOREIGN KEY
team_id         INT  → teams.id        — FOREIGN KEY
group_name      VARCHAR(50)            — название группы (для group_playoff)
played          INT DEFAULT 0
won             INT DEFAULT 0
drawn           INT DEFAULT 0
lost            INT DEFAULT 0
goals_for       INT DEFAULT 0
goals_against   INT DEFAULT 0
goal_difference INT DEFAULT 0
points          INT DEFAULT 0
updated_at      TIMESTAMP
```

### Таблица `player_statistics` — статистика игрока по турниру
```
id              INT AUTO_INCREMENT PRIMARY KEY
tournament_id   INT  → tournaments.id  — FOREIGN KEY
player_id       INT  → users.id        — FOREIGN KEY
team_id         INT  → teams.id        — FOREIGN KEY
goals           INT DEFAULT 0
assists         INT DEFAULT 0
yellow_cards    INT DEFAULT 0
red_cards       INT DEFAULT 0
matches_played  INT DEFAULT 0
updated_at      TIMESTAMP
```

---

## 3.2 Связи между таблицами и ПОЧЕМУ такие связи

### Связи один-ко-многим (One-to-Many)

**users → teams** (через `teams.coach_id`):
Один тренер может иметь ОДНУ команду (бизнес-логика: один coach_id встречается в таблице teams только один раз). Но в теории один человек мог бы быть тренером нескольких команд, поэтому технически это One-to-Many. Связь через FK `teams.coach_id → users.id`.

**users → tournaments** (через `tournaments.organizer_id`):
Один организатор может создать несколько турниров (но бизнес-правило ограничивает: не больше 1 незавершённого). Связь через FK `tournaments.organizer_id → users.id`.

**tournaments → matches** (через `matches.tournament_id`):
Один турнир содержит много матчей. Это самая прямая связь. Когда удаляется турнир — каскадно удаляются все его матчи. FK: `matches.tournament_id → tournaments.id`.

**matches → match_events** (через `match_events.match_id`):
Один матч содержит много событий (голы, карточки). FK: `match_events.match_id → matches.id`.

**tournaments → standings** (через `standings.tournament_id`):
Один турнир имеет множество строк в таблице standings (по одной для каждой команды-участницы). FK: `standings.tournament_id → tournaments.id`.

### Связи многие-ко-многим (Many-to-Many) через промежуточные таблицы

**teams ↔ users** через таблицу `team_players`:
Один игрок теоретически может состоять в разных командах (в разное время), одна команда имеет много игроков. Промежуточная таблица `team_players` хранит оба FK: `team_id` и `player_id`, плюс дополнительные данные: позицию, номер майки, дату вступления.

**tournaments ↔ teams** через таблицу `tournament_teams`:
Один турнир имеет много команд-участниц, одна команда может участвовать в разных турнирах. Промежуточная таблица `tournament_teams` хранит `tournament_id` + `team_id` + статус заявки (pending/approved/rejected) + дату подачи заявки.

### Почему именно такая структура, а не другая:

1. **Нормализация** — данные не дублируются. Имя команды хранится только в `teams`, а не копируется в каждый матч. Это экономит место и исключает рассинхронизацию (если переименовать команду — везде обновится автоматически через JOIN).

2. **Целостность через FK** — нельзя создать матч с несуществующей командой. MySQL заблокирует это на уровне базы данных.

3. **Гибкость запросов** — через JOIN можно получить любую комбинацию: "все матчи этой команды в этом турнире", "все голы этого игрока", "рейтинг всех команд турнира".

---

## 3.3 Пример SQL-запроса с JOIN

```sql
-- Получить все матчи турнира с именами команд:
SELECT
    m.id,
    m.match_date,
    m.round,
    m.status,
    m.team1_score,
    m.team2_score,
    t1.name as team1_name,
    t1.logo as team1_logo,
    t2.name as team2_name,
    t2.logo as team2_logo
FROM matches m
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id
WHERE m.tournament_id = 1
ORDER BY m.match_date ASC;
```

Здесь JOIN выполняется дважды с таблицей `teams` под разными псевдонимами (t1 и t2), потому что каждый матч имеет две команды.

---

# ЧАСТЬ 4 — СИСТЕМА МОДАЛЬНЫХ ОКОН

## 4.1 Что такое модальное окно

Модальное окно (modal) — это всплывающее окно поверх основного контента, которое блокирует взаимодействие с остальной страницей пока открыто. Все диалоги в нашем проекте реализованы как модальные окна.

## 4.2 Структура HTML любого модального окна

```html
<div class="modal" id="auth-modal">          <!-- OUTER: позиционирование, видимость -->
    <div class="modal-overlay"></div>         <!-- OVERLAY: тёмный фон; клик = закрыть -->
    <div class="modal-content">               <!-- CONTENT: белый блок с содержимым -->
        <button class="modal-close">&times;</button>  <!-- X кнопка -->
        <!-- ... содержимое ... -->
    </div>
</div>
```

## 4.3 CSS — как модалка показывается/скрывается

В файле `frontend/css/components.css`:
```css
/* По умолчанию — скрыта */
.modal {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

/* Когда добавляется класс .active — показывается */
.modal.active {
    display: flex;
}

.modal-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.7);  /* тёмный полупрозрачный фон */
}

.modal-content {
    position: relative;
    z-index: 1;
    background: #1a1a2e;          /* тёмный фон окна */
    border-radius: 12px;
    padding: 40px;
    max-width: 520px;
    width: 90%;
}
```

## 4.4 JavaScript — открытие и закрытие

В файле `frontend/js/ui.js`:
```javascript
openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');       // добавляет класс → CSS показывает
    document.body.style.overflow = 'hidden';  // запрещает скролл страницы
},

closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');    // убирает класс → CSS скрывает
    document.body.style.overflow = 'auto';
}
```

## 4.5 Два типа модальных окон в проекте

**Тип 1 — Статические (созданы в HTML или JS один раз):**
- Модалка входа/регистрации (`auth-modal`) — создаётся в `Auth.createAuthModal()` при инициализации
- Модалка редактирования профиля (`edit-profile-modal`) — создаётся при первом открытии

**Тип 2 — Динамические (создаются на лету при каждом открытии):**
- Модалка деталей матча — создаётся каждый раз при клике на матч
- Модалка деталей команды — создаётся при клике на команду
- Модалка деталей турнира — показывает standings/fixtures/statistics

## 4.6 Паттерн создания динамических модалок

```javascript
// Пример из frontend/js/teams.js
showTeamModal(team) {
    // Удаляем старую если есть
    const old = document.getElementById('team-detail-modal');
    if (old) old.remove();

    // Создаём новую
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'team-detail-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <!-- данные команды -->
        </div>
    `;
    document.body.appendChild(modal);

    // Закрытие по оверлею
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        UI.closeModal('team-detail-modal');
    });

    // Открываем
    UI.openModal('team-detail-modal');
}
```

---

# ЧАСТЬ 5 — АУТЕНТИФИКАЦИЯ (Вход / Регистрация)

## 5.1 Как создаётся модалка входа

**Файл:** `frontend/js/auth.js` — метод `Auth.createAuthModal()`

При инициализации страницы (`Auth.init()`) вызывается `createAuthModal()`, который через `document.body.insertAdjacentHTML('beforeend', modalHTML)` добавляет HTML модалки входа/регистрации в конец `<body>`. Это позволяет держать форму в JavaScript, а не в HTML-файле.

Модалка имеет две вкладки (Login / Register) — переключение через `Auth.switchTab(tabName)` который добавляет/убирает класс `active` на нужный контейнер формы.

## 5.2 Процесс РЕГИСТРАЦИИ — шаг за шагом

**Шаг 1: Пользователь заполняет форму**
- Поля: имя, email, пароль, подтверждение пароля, роль
- При вводе в поле "подтвердить пароль" — `Auth.validatePasswordMatch()` проверяет совпадение в реальном времени

**Шаг 2: Клик на "Create Account"**
- `Auth.handleRegister(e)` перехватывает `e.preventDefault()` — отменяет стандартную отправку формы
- Показывает спиннер на кнопке

**Шаг 3: Запрос к серверу**
```javascript
// frontend/js/auth.js
await API.register({
    name, email, password, role
});
// API.register вызывает:
// POST http://localhost:3000/api/auth/register
// Body: { name, email, password, role }
```

**Шаг 4: Сервер принимает запрос**

`backend/routes/auth.js` → `registerLimiter` (rate limit) → `authController.register()`

В `authController.register()`:
1. Валидация данных (все поля заполнены, email корректный, пароль ≥6 символов, роль допустимая)
2. Проверка уникальности email в БД
3. Хеширование пароля: `bcrypt.hash(password, 10)`
4. Генерация токена верификации: `crypto.randomBytes(32).toString('hex')`
5. Сохранение в БД: `INSERT INTO users ... is_verified=0, verification_token=?`
6. Отправка письма с ссылкой: `sendVerificationEmail(email, name, token)`
7. Ответ браузеру: `{ success: true, message: 'Check your email' }`

**Шаг 5: Браузер получает ответ**
- Закрывает модалку
- Показывает popup "Проверьте вашу почту" с кнопкой "Open Email"

**Шаг 6: Пользователь кликает ссылку в письме**
- Ссылка ведёт на: `GET /api/auth/verify/:token`
- Сервер находит пользователя по токену, ставит `is_verified=1`, очищает токен
- Создаёт JWT токен
- Делает редирект на: `http://localhost:5500/frontend/index.html?auth_token=JWT&auth_user=JSON`

**Шаг 7: Браузер получает редирект**
- `Auth.handleVerificationRedirect()` читает параметры из URL
- Сохраняет токен и данные пользователя в localStorage
- Очищает URL через `history.replaceState()`
- Показывает уведомление "Email verified! Welcome!"
- Пользователь автоматически вошёл в систему

## 5.3 Процесс ВХОДА — шаг за шагом

**Шаг 1: Клик на кнопку "Login"**
- Нажатие кнопки "Get Started" в навбаре → `Auth.openAuthModal('login')`
- Открывается модалка с вкладкой Login

**Шаг 2: Отправка формы**
- `Auth.handleLogin(e)` с `e.preventDefault()`
- `API.login({ email, password })`

**Шаг 3: POST запрос к серверу**
```
POST /api/auth/login
Content-Type: application/json
Body: { "email": "...", "password": "..." }
```

**Шаг 4: Сервер**
1. `loginLimiter` проверяет не превышен ли лимит (5 попыток/минуту)
2. `authController.login()`:
   - Ищет пользователя по email в БД
   - `bcrypt.compare(password, user.password)` — сравнивает пароли
   - Проверяет `is_verified = 1`
   - Создаёт JWT: `jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' })`
   - Возвращает `{ success: true, token, user: { id, name, email, role } }`

**Шаг 5: Браузер**
- `API.setToken(token)` → `localStorage.setItem('11unity_token', token)`
- `API.setUser(user)` → `localStorage.setItem('11unity_user', JSON.stringify(user))`
- `Auth.updateUI()` — обновляет интерфейс (скрывает "Get Started", показывает аватар)
- Загружает данные турниров, команд, статистики

## 5.4 Как работает ВЫХОД (logout)

```javascript
// frontend/js/auth.js
logout() {
    if (confirm('Are you sure?')) {
        API.logout();           // удаляет токен и user из localStorage
        Auth.updateUI();        // обновляет интерфейс (показывает "Get Started")
        Tournaments.load();     // перезагружает данные (без токена — публичные)
    }
}
```

## 5.5 Как проверяется токен на каждый запрос

**Файл:** `backend/middleware/auth.js`

```javascript
// При каждом запросе к защищённому endpoint:
// 1. Берём токен из заголовка
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" → "TOKEN"

// 2. Проверяем токен
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Если токен неверный или просроченный — jwt.verify выбрасывает исключение

// 3. Добавляем данные пользователя в запрос
req.user = decoded; // { id, email, role }
next(); // продолжаем к контроллеру
```

---

# ЧАСТЬ 6 — СЕКЦИЯ HOME (Главная страница)

## 6.1 Структура секции Home

В `frontend/index.html` секция home содержит два взаимоисключающих блока:
```html
<section id="home">
    <!-- Блок 1: Показывается незарегистрированным пользователям -->
    <div id="hero-section">
        <h1>Welcome to 11UNITY</h1>
        <button id="hero-cta">Start Your Tournament</button>
    </div>

    <!-- Блок 2: Показывается авторизованным пользователям -->
    <div id="profile-section" style="display:none;">
        <div id="profile-header">...</div>  <!-- Аватар, имя, email, роль -->
        <div id="profile-stats">...</div>   <!-- Динамический контент по роли -->
    </div>
</section>
```

## 6.2 Переключение Hero ↔ Profile

**Файл:** `frontend/js/auth.js` — метод `Auth.updateProfileSection()`

```javascript
updateProfileSection() {
    if (API.isAuthenticated()) {
        // Проверяет: есть токен? Не просрочен?
        heroSection.style.display = 'none';
        profileSection.style.display = 'block';
        // Заполняет имя, email, роль из localStorage
        this.updateProfileStats(user); // загружает данные с сервера
    } else {
        heroSection.style.display = 'block';
        profileSection.style.display = 'none';
    }
}
```

`API.isAuthenticated()` — проверяет не просто наличие токена в localStorage, но и его срок действия:
```javascript
isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    // Декодируем payload (вторая часть JWT после точки)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now(); // exp в секундах → мс
}
```

## 6.3 Профиль игрока (Player Profile)

**Файл:** `frontend/js/auth.js` — метод `Auth.renderPlayerProfile()`
**Данные:** `GET /api/profile/stats` → `backend/routes/profile.js`

Что показывается:
- Команда игрока (название, позиция, номер майки)
- Личная статистика (голы, передачи, жёлтые карточки, красные карточки)
- Последние матчи команды с результатами (W/L/D)
- Кнопка "Leave Team"

Данные берутся из:
- `team_players` (позиция, номер, принадлежность команде)
- `player_statistics` (голы, передачи)
- `match_events` (карточки)
- `matches` (последние матчи)

## 6.4 Профиль тренера (Coach Profile)

**Файл:** `frontend/js/auth.js` — метод `Auth.renderCoachProfile()`

Что показывается:
- Обзор команды (логотип, название, кол-во игроков, текущий турнир)
- Рекорды команды (матчи, победы, ничьи, поражения, голы "за" и "против")
- Список состава (roster): номер, имя, позиция

## 6.5 Профиль организатора (Organizer Profile)

**Файл:** `frontend/js/auth.js` — метод `Auth.renderOrganizerProfile()`

Что показывается:
- Счётчики: всего/активных/предстоящих/завершённых турниров
- Список всех турниров организатора со статусами

---

# ЧАСТЬ 7 — РАЗДЕЛ ТУРНИРЫ (Tournaments)

## 7.1 Инициализация и загрузка

**Файл:** `frontend/js/tournaments.js` — объект `Tournaments`

При инициализации (`Tournaments.init()`):
1. Настраиваются обработчики событий (кнопки фильтров, кнопка создания)
2. Вызывается `Tournaments.load()` — запрос к серверу

```javascript
// GET /api/tournaments
const data = await API.getTournaments();
this.tournaments = data.tournaments; // сохраняем в памяти
this.render(); // рисуем карточки
```

## 7.2 Отображение списка турниров

Метод `Tournaments.render()` — генерирует HTML карточек турниров.

Каждая карточка показывает:
- Название, тип (League/Playoff/Group+Playoff), категорию
- Статус-бейдж (Active/Upcoming/Finished)
- Дату начала, место проведения
- Текущее количество команд / максимум
- Имя организатора
- Описание

Карточки фильтруются по статусу и категории через `Tournaments.filterTournaments()`.

## 7.3 Создание турнира

**Кто может:** только пользователь с ролью `organizer`

Кнопка "Create Tournament" появляется в навбаре только для организаторов — в `Auth.updateUI()`:
```javascript
if (user.role === 'organizer' && createTournamentBtn) {
    createTournamentBtn.style.display = 'inline-flex';
}
```

При клике открывается модалка с формой:
- Название (3-255 символов, уникальное)
- Тип: League / Playoff / Group+Playoff
- Категория: School / University / Amateur
- Дата начала (только будущая)
- Максимум команд (зависит от типа: для League 4/8/12/16/32, для Playoff 4/8/16/32)
- Мин. игроков в команде: 7/9/11
- Место проведения, описание

**Запрос:** `POST /api/tournaments`

На сервере в `tournamentController.createTournament()`:
1. Проверяет все поля и ограничения
2. Проверяет что у организатора нет другого активного/предстоящего турнира
3. Создаёт запись в БД со статусом `'upcoming'`
4. Через WebSocket уведомляет всех подключённых пользователей о новом турнире

## 7.4 Подача заявки на турнир (Join Tournament)

**Кто может:** тренер (coach)

На странице турнира есть кнопка "Join Tournament" (только для тренеров).

**Запрос:** `POST /api/tournaments/:id/join`

На сервере проверяется:
- У тренера есть команда
- Турнир в статусе `'upcoming'`
- Команда ещё не участвует в этом турнире
- Команда не участвует в другом активном турнире
- Турнир не заполнен (teams_count < max_teams)
- У команды достаточно игроков (≥ min_players_per_team)

Если всё ок — создаётся запись `INSERT INTO tournament_teams (tournament_id, team_id, status) VALUES (?, ?, 'pending')`.

## 7.5 Одобрение заявок (только организатор)

В модалке турнира (вкладка Pending Teams) организатор видит список заявок.

- `POST /api/tournaments/:id/teams/:teamId/approve` → `status = 'approved'`
- `POST /api/tournaments/:id/teams/:teamId/reject` → `status = 'rejected'`

## 7.6 Запуск турнира и генерация расписания

**Запрос:** `POST /api/tournaments/:id/start`

Сервер проверяет:
1. Запрашивает организатор (тот же `organizer_id`)
2. Статус турнира `'upcoming'`
3. Количество одобренных команд ≥ 2
4. У каждой команды достаточно игроков

Затем вызывается `generateFixtures(tournamentId, type, teams)`.

### Алгоритм для League (Round-Robin):

```javascript
// backend/controllers/tournamentController.js
function generateRoundRobinFixtures(teams, startDate) {
    const fixtures = [];
    const n = teams.length % 2 === 0 ? teams.length : teams.length + 1; // чётное
    const rounds = n - 1;
    const matchesPerRound = n / 2;

    for (let round = 0; round < rounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const home = (round + match) % (n - 1);
            const away = (n - 1 - match + round) % (n - 1);
            // Последняя команда всегда фиксирована (индекс n-1)
            // ...
        }
    }
}
```

### Алгоритм для Playoff:

Создаются матчи первого раунда. Каждый матч получает `bracket_slot`. После завершения каждого матча система проверяет — завершён ли весь раунд. Если да — автоматически создаются матчи следующего раунда.

### Алгоритм для Group+Playoff:

1. Команды делятся на группы (обычно 2 группы)
2. Внутри каждой группы — Round-Robin
3. Матчи группового этапа получают `round = 'Group A'` или `'Group B'`
4. После завершения группового этапа — лучшие команды (TOP-2 из каждой группы) автоматически попадают в плей-офф
5. Плей-офф матчи создаются с round='SF', 'Final'

После генерации:
- Все матчи вставляются в таблицу `matches`
- Создаются записи в `standings` для каждой команды
- Статус турнира меняется на `'active'`

## 7.7 Страница деталей турнира

При клике на карточку турнира открывается большая модалка с тремя вкладками:

**Вкладка Standings:**
- Для League — таблица (П, В, Н, П, Г+, Г-, ГР, Очки)
- Для Group+Playoff — таблицы групп + playoff bracket
- Для Playoff — только bracket

**Вкладка Statistics:**
- Топ бомбардиры турнира
- Топ ассистенты турнира

**Вкладка Fixtures:**
- Все матчи турнира, сгруппированные по турам
- Для каждого матча: дата, команды, счёт (или "vs" если не сыгран)

**Пользователь присоединяется к WebSocket-комнате:**
```javascript
// frontend/js/websocket.js
WebSocketManager.joinTournament(tournamentId);
// → socket.emit('tournament:join', tournamentId)
```

## 7.8 Ввод результата матча

**Кто может:** организатор турнира

При клике на матч (который scheduled или in_progress) открывается модалка управления матчем.

**Запрос:** `PUT /api/tournaments/:tournamentId/matches/:matchId`
```javascript
body: {
    team1Score: 2,
    team2Score: 1,
    status: 'finished',
    events: [  // события матча
        { playerId: 5, teamId: 1, eventType: 'goal', minute: 23 },
        { playerId: 8, teamId: 1, eventType: 'goal', minute: 67 },
        { playerId: 12, teamId: 2, eventType: 'goal', minute: 45 }
    ]
}
```

На сервере (`tournamentController.updateMatch()`):
1. Проверяет права (только организатор)
2. Обновляет счёт в `matches`
3. Сохраняет события в `match_events`
4. Пересчитывает `standings` (очки, разница голов и т.д.)
5. Обновляет `player_statistics` для всех участников
6. Проверяет — завершены ли все матчи раунда (для плей-офф создаёт следующий раунд)
7. Проверяет — завершён ли весь турнир (ставит `status = 'finished'`)
8. Через WebSocket уведомляет всех о результате

---

# ЧАСТЬ 8 — РАЗДЕЛ КОМАНДЫ (Teams)

## 8.1 Загрузка и отображение

**Файл:** `frontend/js/teams.js`

**Запрос:** `GET /api/teams` → возвращает все команды с количеством игроков и текущим турниром.

SQL запрос в `backend/controllers/teamController.js`:
```sql
SELECT
    t.*,
    u.name as coach_name,
    COUNT(DISTINCT tp.player_id) as players_count,
    MAX(tn.name) as tournament_name,
    MAX(tn.status) as tournament_status
FROM teams t
LEFT JOIN users u ON t.coach_id = u.id
LEFT JOIN team_players tp ON t.id = tp.team_id
LEFT JOIN tournament_teams tt ON t.id = tt.team_id AND tt.status = 'approved'
LEFT JOIN tournaments tn ON tt.tournament_id = tn.id
GROUP BY t.id
ORDER BY t.created_at DESC
```

Здесь `MAX()` нужен из-за требования MySQL — при GROUP BY все не-агрегированные столбцы должны быть в GROUP BY или в агрегатных функциях.

## 8.2 Создание команды

**Кто может:** только coach

Кнопка "Create Team" в навбаре — только для тренеров.

Форма: название (3-100 символов, уникальное), цвет логотипа, макс. игроков.

**Запрос:** `POST /api/teams`

На сервере в `teamController.createTeam()`:
1. Проверяет роль (coach)
2. Проверяет что у этого тренера уже нет команды
3. Валидирует название
4. **Автоматически генерирует логотип** — первые 3 буквы названия в верхнем регистре
5. Создаёт запись в `teams`

```javascript
// backend/controllers/teamController.js
const logo = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
// "FC Ararat-Armenia" → "FCA"
// "FC Noah" → "FCN"
```

## 8.3 Добавление игрока в команду

**Кто может:** только тренер (в свою команду)

В модалке команды тренер нажимает "Add Player" → появляется поле поиска.

**Поиск игроков:** `GET /api/teams/:id/players/search?query=...`

Сервер ищет пользователей с ролью `player`, которые:
- Совпадают по имени/email с поисковым запросом
- Ещё не состоят в команде

**Добавление:** `POST /api/teams/:id/players`
```javascript
body: {
    playerId: 42,
    position: 'midfielder',
    jerseyNumber: 10
}
```

На сервере в `teamController.addPlayer()`:
1. Проверяет что запрашивающий — тренер этой команды
2. Проверяет что игрок не состоит в другой команде
3. Проверяет что команда не заполнена (players_count < max_players)
4. Проверяет уникальность номера майки
5. Создаёт запись в `team_players`

## 8.4 Удаление игрока

**Запрос:** `DELETE /api/teams/:teamId/players/:playerId`

Проверяется что запрашивает тренер этой команды. Затем `DELETE FROM team_players WHERE team_id=? AND player_id=?`.

---

# ЧАСТЬ 9 — РАЗДЕЛ МАТЧИ (Matches)

## 9.1 Страница матчей

**Файл:** `frontend/js/matches.js`

**Запрос:** `GET /api/matches` → все матчи всех турниров

В отличие от Tournaments (там матчи внутри модалки турнира), страница Matches показывает ВСЕ матчи в хронологическом порядке с фильтрами.

## 9.2 Фильтрация матчей

На странице три фильтра:
- По турниру (All Tournaments / конкретный турнир)
- По команде (All Teams / конкретная команда)
- По статусу (All / Scheduled / Finished)

Фильтрация происходит на стороне клиента (JavaScript) — все матчи загружены, выборка делается в памяти:

```javascript
// frontend/js/matches.js
filterMatches() {
    return this.matches.filter(match => {
        const tournamentOk = !this.selectedTournament
            || match.tournament_id == this.selectedTournament;
        const teamOk = !this.selectedTeam
            || match.team1_id == this.selectedTeam
            || match.team2_id == this.selectedTeam;
        const statusOk = !this.selectedStatus
            || match.status === this.selectedStatus;
        return tournamentOk && teamOk && statusOk;
    });
}
```

## 9.3 Группировка матчей по датам

После фильтрации матчи группируются по дате:
```javascript
// Группируем в объект { "2026-04-05": [match1, match2], "2026-04-12": [match3] }
const groups = {};
filtered.forEach(match => {
    const date = match.match_date.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(match);
});
```

Для каждой группы создаётся заголовок с датой и под ним карточки матчей.

## 9.4 Определение названия раунда

Для плей-офф матчей нужно показывать "Semi-Final" / "Final" / "Quarter-Final" вместо номера раунда.

**Файл:** `frontend/js/matches.js` — функция `getPlayoffRoundName(round, tournamentId)`

Для именованных раундов ('SF', 'Final', 'QF', 'R16') — возвращает соответствующее название.
Для числовых раундов — вычисляет позицию от конца:
```javascript
// Если max_teams=8 → expectedMaxRound=3 (log2(8)=3)
// Раунд 3 → finalDiff=0 → "Final"
// Раунд 2 → finalDiff=1 → "Semi-Final"
// Раунд 1 → finalDiff=2 → "Quarter-Final"
```

## 9.5 Модалка деталей матча

При клике на любой матч открывается модалка с деталями:
- Оба логотипа команд
- Счёт (или "VS" если scheduled)
- Статус матча
- Список событий (голы, карточки) с именами игроков и минутами

**Запрос:** `GET /api/tournaments/:tournamentId/matches/:matchId`

Возвращает матч + все события из `match_events` с JOIN на `users` (для имён игроков) и `teams` (для названий команд).

## 9.6 Управление матчем (только организатор)

Если открытый матч принадлежит турниру авторизованного организатора — в модалке появляется панель управления:
- Ввод счёта
- Добавление событий (гол: выбор игрока, минута; карточка: выбор игрока, тип, минута)
- Кнопка "Finish Match"

**Важно:** кнопка управления матчем показывается только если `match.match_date <= now`. Нельзя вводить результат для будущих матчей.

---

# ЧАСТЬ 10 — РАЗДЕЛ СТАТИСТИКА (Statistics)

## 10.1 Глобальная статистика

**Файл:** `frontend/js/statistics.js`

**Запрос:** `GET /api/statistics`

В файле `backend/routes/statistics.js` выполняются запросы:
```sql
-- Общие счётчики
SELECT COUNT(*) FROM tournaments WHERE status != 'upcoming' as tournaments_count
SELECT COUNT(*) FROM teams as teams_count
SELECT COUNT(*) FROM matches as matches_count
SELECT COUNT(*) FROM users WHERE role = 'player' as players_count
SELECT SUM(goals) FROM player_statistics as total_goals

-- Топ бомбардиры (все турниры)
SELECT u.name, t.name as team_name, SUM(ps.goals) as total_goals
FROM player_statistics ps
JOIN users u ON ps.player_id = u.id
JOIN teams t ON ps.team_id = t.id
GROUP BY ps.player_id
ORDER BY total_goals DESC LIMIT 5

-- Топ ассистенты — аналогично
```

Показывается на экране: 5 блоков (турниры, команды, матчи, игроки, голы) + таблицы топ-5 бомбардиров и ассистентов.

## 10.2 Статистика по конкретному турниру

При выборе турнира из dropdown — **Запрос:** `GET /api/statistics/tournaments/:id`

Возвращает:
- Данные турнира (название, тип, статус, max_teams)
- Таблица групп standings (для league и group_playoff)
- Топ бомбардиры и ассистенты этого турнира

В зависимости от типа турнира:
- **League** → рендерит только таблицу `renderStandings()`
- **Playoff** → рендерит только bracket `renderBracket()`
- **Group+Playoff** → рендерит таблицу групп + bracket `renderStandings()` + `renderBracket()`

## 10.3 Отображение турнирной таблицы (standings)

Метод `Statistics.renderStandings(standings, tournament)` генерирует HTML таблицы:
```
# | Team | P | W | D | L | GF | GA | GD | Pts
```

Для group_playoff — таблицы разбиваются по группам через `group_name`.

## 10.4 Отображение playoff bracket

Метод `Statistics.renderBracket(matches, maxTeams)`:

1. Получает все плей-офф матчи
2. Группирует по раундам: `{ 'SF': [match1, match2], 'Final': [match3] }`
3. Для именованных раундов ('SF', 'Final') — сортирует по порядку (R16 → QF → SF → Final)
4. Для числовых — сортирует по возрастанию
5. Рендерит столбцы: каждый раунд = отдельный столбец
6. В каждом матче выделяется зелёным победитель (если статус `'finished'`)

Названия раундов:
- 'SF' → "Semi-Final"
- 'Final' → "Final"
- 'QF' → "Quarter-Final"
- 'R16' → "Round of 16"
- Числа: считается от конца (последний раунд = Final, предпоследний = Semi-Final)

---

# ЧАСТЬ 11 — МУЛЬТИЯЗЫЧНОСТЬ (i18n)

## 11.1 Как работает система переводов

**Файл:** `frontend/js/i18n.js`

Система переводов — самописная, без сторонних библиотек. Поддерживает 4 языка: EN, RU, HY (армянский), GE (грузинский).

**Файлы переводов:** `frontend/locales/en.js`, `ru.js`, `hy.js`, `ge.js`

Каждый файл экспортирует объект вида:
```javascript
window.LOCALES_EN = {
    nav: { home: 'Home', tournaments: 'Tournaments', ... },
    auth: { login: 'Login', register: 'Register', ... },
    tournaments: { create: 'Create Tournament', ... }
};
```

## 11.2 Получение перевода

```javascript
// frontend/js/i18n.js
t(key, fallback) {
    // key = 'auth.login' → ищет LOCALES['auth']['login']
    const keys = key.split('.');
    let value = this.translations;
    for (const k of keys) {
        value = value[k];
        if (!value) return fallback || key;
    }
    return value;
}
```

## 11.3 Применение к HTML элементам

Статические тексты в HTML помечены атрибутами:
```html
<span data-i18n="nav.home">Home</span>
<input data-i18n-placeholder="auth.emailPlaceholder">
```

Метод `I18n.applyTranslations()` проходит по всем элементам с такими атрибутами и заменяет текст.

## 11.4 Смена языка

```javascript
I18n.setLanguage('hy'); // 'en', 'ru', 'hy', 'ge'
// → сохраняет в localStorage
// → загружает нужный locale файл
// → вызывает applyTranslations()
// → emit custom event 'languageChanged'
// → модули перерисовывают динамический контент
```

---

# ЧАСТЬ 12 — БЕЗОПАСНОСТЬ

## 12.1 Все меры безопасности в проекте

| Угроза | Наша защита |
|--------|------------|
| Кража паролей | bcrypt хеширование (соль + 10 раундов) |
| Подмена запросов | JWT подпись (невозможно подделать без секретного ключа) |
| Brute force атаки | express-rate-limit (5 попыток/минуту для login) |
| SQL инъекции | Параметризованные запросы (mysql2 escaping) |
| XSS атаки | escapeHtml() перед вставкой в innerHTML |
| CSRF | JWT в header (не в cookies) |
| Несанкционированный доступ | Middleware проверяет JWT + проверяет роль |
| Утечка данных | .env файл не в git, secrets не в коде |

## 12.2 Параметризованные запросы (защита от SQL инъекций)

```javascript
// ПРАВИЛЬНО — данные передаются как параметры, не конкатенируются в строку
await db.promise().query(
    'SELECT * FROM users WHERE email = ?',
    [userInputEmail]  // mysql2 автоматически экранирует
);

// НЕПРАВИЛЬНО (уязвимо к SQL инъекции):
// await db.promise().query('SELECT * FROM users WHERE email = ' + email);
```

## 12.3 Защита от XSS

XSS (Cross-Site Scripting) — атака, при которой злоумышленник вставляет вредоносный JS-код в данные (имя пользователя, название команды). Если эти данные вставить напрямую в innerHTML — код выполнится.

```javascript
// frontend/js/auth.js
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')   // < → не парсится как тег
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Использование:
html += `<span>${escapeHtml(user.name)}</span>`;
// Если name = '<script>alert(1)</script>' → отобразится как текст, не выполнится
```

---

# ЧАСТЬ 13 — КАК ВСЁ ЗАПУСКАЕТСЯ

## 13.1 Запуск backend

```bash
cd backend
node server.js
```

Что происходит при запуске:
1. Загружается `.env` (dotenv)
2. Создаётся Express приложение
3. Настраиваются middleware
4. Подключается MySQL connection pool
5. Проверяется соединение с БД (`db.getConnection()`)
6. Регистрируются все маршруты
7. Инициализируется Socket.IO
8. Запускается cron + немедленно вызывается `checkAndActivateTournaments()`
9. Сервер начинает слушать порт 3000

## 13.2 Запуск frontend

Открытие `frontend/index.html` через Live Server (VSCode) на порту 5500.

Что происходит при открытии страницы:
1. Браузер загружает `index.html`
2. Последовательно загружаются JS файлы (в порядке тегов `<script>`)
3. После загрузки DOM — срабатывает `DOMContentLoaded` в `main.js`
4. Инициализируются все модули: I18n → UI → Auth → Tournaments → Teams → Matches → Statistics → WebSocketManager
5. `Auth.init()` проверяет localStorage — если есть токен, показывает профиль
6. Все модули загружают данные с сервера
7. WebSocket подключается к `ws://localhost:3000`

## 13.3 Жизненный цикл HTTP запроса (полный путь)

Нажатие "Login" → отправка формы:

```
Браузер
  → fetch('http://localhost:3000/api/auth/login', { method:'POST', body:JSON })
     ↓
Express server
  → cors middleware (проверяет origin)
  → express.json() middleware (парсит JSON из body)
  → логирование (console.log метод + URL)
  → app.use('/api/auth') → routes/auth.js
  → loginLimiter (rate limit check)
  → POST /login → authController.login()
     ↓
authController.login()
  → db.query('SELECT * FROM users WHERE email = ?')
  → bcrypt.compare(password, hash)
  → jwt.sign({ id, email, role })
  → res.json({ success: true, token, user })
     ↓
Браузер получает ответ
  → API.setToken(token) → localStorage
  → API.setUser(user) → localStorage
  → Auth.updateUI() → профиль показан
```

---

# КРАТКАЯ ШПАРГАЛКА ДЛЯ ЗАЩИТЫ

## Что сказать когда спрашивают "как работает X?"

**JWT:**
> "Пользователь входит — сервер создаёт токен с ID и ролью, подписывает его секретным ключом, отдаёт браузеру. Браузер хранит токен в localStorage и отправляет его при каждом запросе в заголовке Authorization. Сервер проверяет подпись токена — если верная, знает кто это и какая у него роль."

**bcrypt:**
> "При регистрации пароль хешируется — преобразуется в строку из которой нельзя восстановить исходный пароль. При входе вводимый пароль хешируется тем же алгоритмом и сравнивается с сохранённым хешем. Если совпадают — пароль верный."

**WebSocket:**
> "HTTP — это запрос-ответ, нужно каждый раз спрашивать 'есть обновления?'. WebSocket — постоянное соединение. Когда организатор вводит гол, сервер сразу отправляет обновление всем, кто смотрит этот турнир. Страница обновляется автоматически без перезагрузки."

**Round-Robin:**
> "Алгоритм составления расписания. Каждая команда играет с каждой другой ровно один раз. Для n команд нужно n-1 туров. Математически: позиции команд вращаются по кругу, одна фиксирована. Это гарантирует что никто не играет дважды с одним соперником."

**connection pool:**
> "Вместо того чтобы при каждом запросе открывать новое соединение с базой данных (это медленно — занимает 100-200мс), мы заранее создаём пул из 10 готовых соединений. Пришёл запрос — берём готовое соединение, используем, возвращаем обратно. Намного быстрее."

**Почему один HTML файл (SPA):**
> "Single Page Application — все секции (Tournaments, Teams, Matches, Statistics) находятся в одном index.html. Навигация между разделами — просто скролл или показ/скрытие секций через CSS. Не нужно загружать новую страницу — всё быстро и плавно."

---

*Документ создан для подготовки к защите дипломной работы 11UNITY*
*Дата: 2026-03-20*
