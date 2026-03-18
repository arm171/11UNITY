# 11UNITY — Полная документация проекта
## Контекст для работы с Claude

---

## Основное

**Название:** 11UNITY
**Тип:** Веб-платформа для управления футбольными турнирами
**Назначение:** Дипломная работа (НПУА — Национальный Политехнический Университет Армении)
**Студент:** Арман Вермишян, группа СС219
**Руководитель:** Г. Томеян
**Статус:** Завершён (март 2026)

---

## Стек технологий

### Backend
| Библиотека | Версия | Назначение |
|-----------|--------|-----------|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 4.x | Веб-фреймворк, REST API |
| mysql2 | 3.x | Драйвер MySQL |
| jsonwebtoken | 9.x | JWT аутентификация |
| bcrypt | 5.x | Хеширование паролей |
| socket.io | 4.7 | WebSocket реалтайм |
| nodemailer | 6.x | Отправка email (Gmail SMTP) |
| express-rate-limit | 7.x | Защита от брутфорса |
| cors | 2.x | Cross-Origin Resource Sharing |
| dotenv | 16.x | Переменные окружения |
| crypto | встроен | Генерация случайных токенов |

### Frontend
| Технология | Назначение |
|-----------|-----------|
| Vanilla JavaScript (ES6+) | Логика, DOM, API запросы |
| HTML5 | Структура (один файл — SPA) |
| CSS3 | Стили (Flexbox, Grid, переменные) |
| Fetch API | HTTP запросы к backend |
| localStorage | Хранение JWT токена и данных |
| Socket.IO client | WebSocket соединение |
| Font Awesome | Иконки |
| Google Fonts (Roboto) | Шрифт |

### База данных
- **MySQL 8.0**
- Имя БД: `11UNITY_db`
- Конфиг в `.env` файле

---

## Запуск проекта

```bash
# Backend (порт 3000)
cd backend
node server.js

# Frontend
# Открывается через Live Server VSCode
# URL: http://127.0.0.1:5500/frontend/index.html
```

**CORS:** backend разрешает все origins (`app.use(cors())`).
**Два разных порта** — поэтому CORS включён.

---

## Структура файлов

```
11UNITY/
├── backend/
│   ├── server.js                          ← точка входа Express
│   ├── schema.sql                         ← структура БД
│   ├── .env                               ← секреты (не в git)
│   ├── config/
│   │   └── database.js                    ← подключение MySQL (pool)
│   ├── middleware/
│   │   └── auth.js                        ← проверка JWT + authorize(role)
│   ├── routes/
│   │   ├── auth.js                        ← /api/auth/* + rate limiters
│   │   ├── teams.js                       ← /api/teams/*
│   │   ├── tournaments.js                 ← /api/tournaments/*
│   │   ├── matches.js                     ← /api/matches/*
│   │   └── statistics.js                  ← /api/statistics/*
│   ├── controllers/
│   │   ├── authController.js              ← register, login, verify, forgotPassword, resetPassword
│   │   ├── teamController.js              ← CRUD команд + игроки
│   │   ├── tournamentController.js        ← CRUD турниров + старт + fixtures
│   │   ├── matchController.js             ← результаты, события матчей
│   │   └── statisticsController.js        ← глобальная + турнирная статистика
│   ├── services/
│   │   ├── emailService.js                ← sendVerificationEmail, sendPasswordResetEmail
│   │   └── fixturesGenerator.js           ← Round-Robin алгоритм
│   └── scripts/
│       ├── migrate_add_password_reset.js  ← миграция: поля reset_token
│       └── migrate_tournament_teams_status.js ← миграция: поле status в tournament_teams
│
└── frontend/
    ├── index.html                         ← ЕДИНСТВЕННЫЙ HTML (SPA)
    ├── css/
    │   ├── reset.css                      ← сброс стилей браузера
    │   ├── variables.css                  ← CSS переменные (цвета, размеры)
    │   ├── components.css                 ← кнопки, карточки, модалки, spinner
    │   └── main.css                       ← стили секций страницы
    ├── js/
    │   ├── config.js                      ← CONFIG.API_URL (загружается 1-м!)
    │   ├── i18n.js                        ← система переводов
    │   ├── api.js                         ← API.request() — все HTTP запросы
    │   ├── websocket.js                   ← Socket.IO клиент
    │   ├── auth.js                        ← вход, регистрация, forgot password
    │   ├── ui.js                          ← UI.showToast, UI.openModal, UI.escapeHtml
    │   ├── tournaments.js                 ← турниры
    │   ├── teams.js                       ← команды
    │   ├── matches.js                     ← матчи
    │   ├── statistics.js                  ← статистика + playoff bracket
    │   └── main.js                        ← App.init() — инициализация (ПОСЛЕДНИЙ)
    └── locales/
        ├── en.js                          ← английский (основной, полный)
        ├── ru.js                          ← русский (полный)
        ├── hy.js                          ← армянский (полный)
        └── ge.js                          ← грузинский (полный)
```

---

## Роли пользователей (RBAC)

| Действие | Player | Coach | Organizer |
|---------|--------|-------|-----------|
| Просмотр турниров/команд/матчей | ✓ | ✓ | ✓ |
| Вступление в команду | ✓ | ✗ | ✗ |
| Создание команды | ✗ | ✓ | ✗ |
| Добавление игроков в команду | ✗ | ✓ | ✗ |
| Подача заявки на турнир | ✗ | ✓ | ✗ |
| Создание турнира | ✗ | ✗ | ✓ |
| Подтверждение/отклонение заявок | ✗ | ✗ | ✓ |
| Старт турнира | ✗ | ✗ | ✓ |
| Ввод счёта матча | ✗ | ✗ | ✓ |
| Добавление событий матча | ✗ | ✗ | ✓ |

---

## База данных — таблицы

### users
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100)
email VARCHAR(100) UNIQUE
password VARCHAR(255)           -- bcrypt hash
role ENUM('player','coach','organizer')
is_verified BOOLEAN DEFAULT false
verification_token VARCHAR(64)
reset_token VARCHAR(64)         -- для forgot password
reset_token_expires DATETIME    -- срок действия токена (1 час)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### teams
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100) UNIQUE
logo VARCHAR(3)                 -- первые 3 буквы названия
logo_color VARCHAR(7)           -- HEX цвет
description TEXT
max_players INT
coach_id INT → users.id
created_at, updated_at TIMESTAMP
```

### team_players (связующая: команда ↔ игрок)
```sql
id INT PRIMARY KEY
team_id INT → teams.id ON DELETE CASCADE
player_id INT → users.id
position ENUM(...)
jersey_number INT
joined_at TIMESTAMP
```

### tournaments
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(255) UNIQUE
type ENUM('league','playoff','group_playoff')
category ENUM(...)
start_date DATE
location VARCHAR(255)
description TEXT
max_teams INT
min_players_per_team INT
status ENUM('upcoming','active','finished')
organizer_id INT → users.id
created_at, updated_at TIMESTAMP
```

### tournament_teams (связующая: турнир ↔ команда)
```sql
id INT PRIMARY KEY
tournament_id INT → tournaments.id
team_id INT → teams.id
status ENUM('pending','approved','rejected')
joined_at TIMESTAMP
```

### matches
```sql
id INT PRIMARY KEY AUTO_INCREMENT
tournament_id INT → tournaments.id
team1_id INT → teams.id
team2_id INT → teams.id
match_date DATETIME
round VARCHAR(50)
bracket_slot INT                -- для playoff: позиция в сетке
team1_score INT                 -- NULL пока не сыгран
team2_score INT                 -- NULL пока не сыгран
status ENUM('scheduled','in_progress','finished')
created_at, updated_at TIMESTAMP
```

### match_events
```sql
id INT PRIMARY KEY AUTO_INCREMENT
match_id INT → matches.id
team_id INT → teams.id
player_id INT → users.id
event_type ENUM('goal','yellow_card','red_card')
minute INT
is_own_goal BOOLEAN DEFAULT false
assist_player_id INT → users.id  -- NULL если нет ассиста
description TEXT
created_at TIMESTAMP
```

### standings
```sql
id INT PRIMARY KEY AUTO_INCREMENT
tournament_id INT → tournaments.id
team_id INT → teams.id
played INT DEFAULT 0
won INT DEFAULT 0
drawn INT DEFAULT 0
lost INT DEFAULT 0
goals_for INT DEFAULT 0
goals_against INT DEFAULT 0
goal_difference INT DEFAULT 0
points INT DEFAULT 0
created_at, updated_at TIMESTAMP
```

### player_statistics
```sql
id INT PRIMARY KEY AUTO_INCREMENT
tournament_id INT → tournaments.id
player_id INT → users.id
team_id INT → teams.id
goals INT DEFAULT 0
assists INT DEFAULT 0
yellow_cards INT DEFAULT 0
red_cards INT DEFAULT 0
matches_played INT DEFAULT 0
updated_at TIMESTAMP
```

**Итого: 9 таблиц**

### Связи таблиц
- One-to-Many: user → teams (coach_id), user → tournaments (organizer_id), tournament → matches, match → match_events, tournament → standings
- Many-to-Many: teams ↔ players (через team_players), tournaments ↔ teams (через tournament_teams)
- Foreign Key правила: CASCADE для удаления зависимых записей, RESTRICT для защиты важных данных

---

## Типы турниров

### league (Лига / Круговой)
- Каждая команда играет против каждой (Round-Robin)
- Таблица standings с очками (победа=3, ничья=1, поражение=0)
- Победитель: наибольшее количество очков
- Frontend: отображается standings таблица

### playoff (Плей-офф / Кубок)
- Кубковая система: проигравший выбывает
- Нет ничьих (в playoff ничья не допускается)
- bracket_slot определяет позицию пары в следующем раунде
- Победитель автоматически переходит в следующий раунд
- Frontend: отображается визуальная сетка (bracket) с колонками раундов
- Пример: 8 команд → Четвертьфинал (4 матча) → Полуфинал (2) → Финал (1)

### group_playoff (Группа + Плей-офф / Смешанный)
- Этап 1: Групповой (Round-Robin внутри групп)
- Этап 2: Лучшие команды из групп выходят в плей-офф
- Frontend: показывает и standings и bracket

---

## Алгоритмы

### 1. JWT Аутентификация
```
Регистрация:
  1. Валидация email (формат) + пароль (мин. 6 символов)
  2. Проверка уникальности email в БД
  3. bcrypt.hash(password, 10) — 10 раундов salt
  4. INSERT в users (is_verified = false)
  5. crypto.randomBytes(32).toString('hex') → verification_token
  6. UPDATE users SET verification_token = token
  7. sendVerificationEmail(email, name, token)
  8. Ответ: { success: true } (без JWT до верификации)

Вход:
  1. SELECT * FROM users WHERE email = ?
  2. bcrypt.compare(inputPassword, user.password)
  3. Если неверно → 401
  4. jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '24h' })
  5. Ответ: { token, user: { id, name, email, role } }

Middleware auth.js (каждый защищённый запрос):
  1. Читает Authorization: Bearer TOKEN
  2. jwt.verify(token, JWT_SECRET) → decoded
  3. req.user = decoded
  4. next() или 401

authorize(role) middleware:
  1. Проверяет req.user.role === role
  2. Если нет → 403 Forbidden
```

### 2. Round-Robin (генерация матчей для лиги)
```
Входные данные: массив команд (N штук)

Если N нечётное → добавляем "BYE" (фиктивная команда)
Количество туров = N - 1
Матчей в туре = N / 2

Для каждого тура r (0 до N-2):
  Для каждого матча m (0 до N/2-1):
    home = (r + m) % (N-1)
    away = (N-1-m+r) % (N-1)
    Если m == 0: away = N-1 (фиксированная команда)
    Пропустить если home или away == "BYE"
    Создать матч: teams[home] vs teams[away]

Для двойного кругового: повторить с перестановкой home↔away
Всего матчей: N × (N-1)

Дополнительно учитывает:
  - Разрешённые дни недели
  - Макс. матчей в день
  - Дни отдыха между турами
```

### 3. Playoff Bracket (генерация плей-офф сетки)
```
Входные данные: N команд (должно быть степень двойки: 4, 8, 16...)

Раунд 1 (начальный):
  Пары: команда[0] vs команда[N-1], команда[1] vs команда[N-2], ...
  bracket_slot = 0, 1, 2, ... (порядковый номер пары)

Следующий раунд:
  Победитель матча bracket_slot=0 встречается с победителем bracket_slot=1
  Победитель матча bracket_slot=2 встречается с победителем bracket_slot=3
  ...

Матч создаётся когда оба победителя известны.
В playoff ничья не допускается (валидация на backend).
```

### 4. Подсчёт очков и standings
```
После каждого завершённого матча:
  1. Определяем победителя по счёту
  2. Победитель: +3 очка, +1 win, +1 played
  3. Проигравший: +0 очков, +1 loss, +1 played
  4. Ничья: оба +1 очко, +1 draw, +1 played
  5. goals_for += забитые, goals_against += пропущенные
  6. goal_difference = goals_for - goals_against
  7. UPDATE standings SET ...
  8. io.emit('standings:update', data) — WebSocket уведомление
```

### 5. Подсчёт статистики игроков
```
После каждого матча, из match_events:
  - event_type='goal' + is_own_goal=false → goals+1 для player_id
  - event_type='goal' + is_own_goal=true → goals не засчитывается player_id, гол идёт противнику
  - assist_player_id != null → assists+1 для assist_player_id
  - event_type='yellow_card' → yellow_cards+1
  - event_type='red_card' → red_cards+1
  - matches_played+1 для всех участников

Данные записываются в player_statistics.
```

### 6. Автоматическое завершение турнира
```
После каждого завершённого матча:
  SELECT COUNT(*) FROM matches
  WHERE tournament_id = ? AND status != 'finished'

  Если COUNT = 0:
    UPDATE tournaments SET status = 'finished' WHERE id = ?
    io.emit('tournament:finished', { tournament_id })
```

### 7. WebSocket события
```
Клиент подключается → JWT верификация через Socket.IO middleware

События от клиента к серверу:
  tournament:join { tournament_id } → клиент входит в комнату

События от сервера к клиентам:
  score:updated { match, team1_score, team2_score }
  standings:update { standings[] }
  statistics:update { player_statistics[] }
  tournament:finished { tournament_id }
  tournament:created { tournament }
  team:joined { team, tournament_id }
```

### 8. Forgot Password (Сброс пароля)
```
Шаг 1 — Запрос:
  POST /api/auth/forgot-password { email }
  Rate limit: 5 запросов / 15 минут

  1. SELECT user WHERE email = ?
  2. Если не найден → ВСЁ РАВНО ответ 200 (безопасность: не раскрываем)
  3. token = crypto.randomBytes(32).toString('hex')
  4. expires = NOW() + 1 HOUR
  5. UPDATE users SET reset_token = token, reset_token_expires = expires
  6. sendPasswordResetEmail(email, name, token)
  7. Ответ: { success: true }

Шаг 2 — Сброс:
  POST /api/auth/reset-password { token, newPassword }

  1. SELECT user WHERE reset_token = ? AND reset_token_expires > NOW()
  2. Если не найден → 400 "Invalid or expired token"
  3. bcrypt.hash(newPassword, 10)
  4. UPDATE users SET password = hash, reset_token = NULL, reset_token_expires = NULL
  5. Ответ: { success: true }

Frontend:
  - Если email уже введён в поле логина → берём его автоматически
  - Иначе показываем мини-форму для ввода email
  - После отправки → красивая карточка с кнопкой "Открыть почту"
  - Пользователь кликает ссылку в письме → браузер открывает ?reset_token=TOKEN
  - auth.js видит reset_token в URL → открывает модалку нового пароля
```

### 9. Email верификация
```
При регистрации:
  token = crypto.randomBytes(32).toString('hex')
  UPDATE users SET verification_token = token
  Письмо: http://127.0.0.1:5500/frontend/index.html?token=TOKEN

При клике на ссылку:
  GET /api/auth/verify/:token
  UPDATE users SET is_verified = true, verification_token = NULL
  Redirect → frontend с ?verified=true

Frontend:
  auth.js при загрузке проверяет URL параметры:
  - ?token=... → вызывает верификацию
  - ?reset_token=... → открывает модалку сброса пароля
  - ?verified=true → показывает toast "Email verified!"
```

---

## API маршруты

### Auth (/api/auth)
| Метод | URL | Защита | Описание |
|-------|-----|--------|---------|
| POST | /register | Public + RateLimit(3/час) | Регистрация |
| GET | /verify/:token | Public | Подтверждение email |
| POST | /login | Public | Вход |
| POST | /forgot-password | Public + RateLimit(5/15min) | Запрос сброса пароля |
| POST | /reset-password | Public | Установка нового пароля |
| GET | /profile | JWT | Профиль пользователя |

### Teams (/api/teams)
| Метод | URL | Защита | Описание |
|-------|-----|--------|---------|
| GET | / | JWT | Список всех команд |
| POST | / | Coach | Создать команду |
| GET | /:id | JWT | Детали команды |
| PUT | /:id | Coach | Обновить команду |
| DELETE | /:id | Coach | Удалить команду |
| POST | /:id/players | Coach | Добавить игрока |
| DELETE | /:id/players/:playerId | Coach | Удалить игрока |

### Tournaments (/api/tournaments)
| Метод | URL | Защита | Описание |
|-------|-----|--------|---------|
| GET | / | JWT | Список турниров |
| POST | / | Organizer | Создать турнир |
| GET | /:id | JWT | Детали турнира |
| PUT | /:id | Organizer | Обновить турнир |
| DELETE | /:id | Organizer | Удалить турнир |
| POST | /:id/join | Coach | Заявка на участие (статус pending) |
| GET | /:id/pending-teams | Organizer | Список ожидающих заявок |
| POST | /:id/teams/:teamId/approve | Organizer | Подтвердить заявку |
| POST | /:id/teams/:teamId/reject | Organizer | Отклонить заявку |
| POST | /:id/start | Organizer | Запустить турнир |
| GET | /:id/fixtures | JWT | Расписание матчей |
| GET | /:id/standings | JWT | Таблица очков |
| GET | /:id/bracket | JWT | Плей-офф сетка |

### Matches (/api/matches)
| Метод | URL | Защита | Описание |
|-------|-----|--------|---------|
| GET | / | JWT | Список матчей |
| GET | /:id | JWT | Детали матча |
| PUT | /:id/score | Organizer | Обновить счёт |
| POST | /:id/events | Organizer | Добавить событие (гол/карточка) |
| DELETE | /:id/events/:eventId | Organizer | Удалить событие |
| POST | /:id/finish | Organizer | Завершить матч |

### Statistics (/api/statistics)
| Метод | URL | Защита | Описание |
|-------|-----|--------|---------|
| GET | / | Public | Глобальная статистика |
| GET | /tournaments | JWT | Список турниров для статистики |
| GET | /tournament/:id | JWT | Статистика конкретного турнира |

---

## Frontend архитектура (SPA)

### Порядок загрузки JS (КРИТИЧЕСКИ ВАЖЕН!)
```html
<script src="js/config.js">     ← 1. CONFIG.API_URL — используют все
<script src="js/i18n.js">       ← 2. Система переводов
<script src="locales/en.js">    ← 3. Переводы EN
<script src="locales/ru.js">    ← 4. Переводы RU
<script src="locales/hy.js">    ← 5. Переводы HY (армянский)
<script src="locales/ge.js">    ← 6. Переводы GE (грузинский)
<script src="js/api.js">        ← 7. HTTP слой
<script src="js/websocket.js">  ← 8. WebSocket
<script src="js/auth.js">       ← 9. Аутентификация
<script src="js/ui.js">         ← 10. UI компоненты
<script src="js/tournaments.js"> ← 11. Турниры
<script src="js/teams.js">      ← 12. Команды
<script src="js/matches.js">    ← 13. Матчи
<script src="js/statistics.js"> ← 14. Статистика
<script src="js/main.js">       ← 15. App.init() — ПОСЛЕДНИЙ
```

### config.js
```js
const CONFIG = {
    API_URL: 'http://localhost:3000/api'
};
```

### api.js — API.request()
```js
// Все запросы через этот метод
API.request('/tournaments', 'GET')           // GET /api/tournaments
API.request('/tournaments', 'POST', data)    // POST с body
// Автоматически добавляет JWT токен из localStorage
// ВАЖНО: НЕ писать /api/ в начале пути — удвоение!
```

### i18n система
```js
// Файлы locales/en.js, ru.js, hy.js, ge.js — объекты переводов
// HTML атрибут: data-i18n="nav.home"
// JS: I18n.t('nav.home') → "Home" / "Главная" / "Տուն"
// Смена языка: localStorage.setItem('language', 'ru')
// Событие: window.dispatchEvent(new Event('languageChanged'))
```

### UI.js ключевые методы
```js
UI.showToast(message, type)      // type: 'success', 'error', 'info'
UI.openModal(modalId)            // открыть модальное окно
UI.closeModal(modalId)           // закрыть
UI.showLoading(containerId)      // показать spinner
UI.hideLoading(containerId)      // убрать spinner
UI.escapeHtml(str)               // защита от XSS
```

### Навигация (SPA)
```js
// Секции: home, tournaments, teams, matches, statistics
// Клик по nav → скрывает все секции → показывает нужную
// URL не меняется (якорные ссылки #section перехватываются JS)
```

### localStorage
```js
localStorage.getItem('token')         // JWT токен
localStorage.getItem('user')          // JSON: { id, name, email, role }
localStorage.getItem('language')      // 'en', 'ru', 'hy', 'ge'
```

---

## Email сервис (emailService.js)

```js
// Конфиг транспортера
nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,  // TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // Google App Password
    }
})

// Две функции:
sendVerificationEmail(toEmail, name, token)
// Ссылка: http://127.0.0.1:5500/frontend/index.html?token=TOKEN

sendPasswordResetEmail(toEmail, name, token)
// Ссылка: http://127.0.0.1:5500/frontend/index.html?reset_token=TOKEN

// Письма в HTML, тёмно-зелёный дизайн совпадает с сайтом
```

### .env переменные
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=11UNITY_db
JWT_SECRET=...
EMAIL_USER=...@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   (Google App Password)
PORT=3000
```

---

## Безопасность

| Угроза | Защита |
|--------|--------|
| Перебор паролей | express-rate-limit на /login |
| Спам регистраций | RateLimit: 3/час на /register |
| Спам сброса пароля | RateLimit: 5/15мин на /forgot-password |
| Неверный JWT | jwt.verify() в middleware, 401 при ошибке |
| Доступ без прав | authorize(role) middleware, 403 |
| XSS в HTML | UI.escapeHtml() для всех пользовательских данных |
| SQL инъекции | Параметризованные запросы mysql2 (?) |
| Открытый пароль | bcrypt hash (10 раундов), нельзя расшифровать |
| Просроченный токен сброса | reset_token_expires > NOW() проверка |
| Утечка email | Одинаковый ответ для найденного и не найденного email |

---

## Известные баги (решённые)

### 1. MySQL ONLY_FULL_GROUP_BY
**Проблема:** MySQL 8 не разрешает GROUP BY t.id если SELECT содержит не-агрегированные колонки.
**Исправление:** Добавлены все колонки в GROUP BY или обёрнуты в MAX().
**Файлы:** teamController.js

### 2. Двойной /api в запросах
**Проблема:** CONFIG.API_URL = '.../api', API.request('/api/...') → двойной /api/api/
**Правило:** Всегда писать API.request('/tournaments'), НЕ API.request('/api/tournaments')
**Файлы:** statistics.js, auth.js

### 3. CSS/JS класс дропдауна языка
**Проблема:** CSS использовал .show, JS использовал .active
**Исправление:** Унифицировано в .active

### 4. Неверный Unicode в армянском локале
**Проблема:** \u576 (3 hex цифры) → SyntaxError
**Исправление:** \u0576 (4 hex цифры)
**Файл:** locales/hy.js

### 6. Команда сразу появлялась в турнире без одобрения
**Проблема:** `tournament_teams` не имела колонки `status` в schema.sql → INSERT без status → DB default = 'approved' → команда сразу в турнире.
**Исправление:** Миграция добавила `status ENUM('pending','approved')`. INSERT теперь явно указывает `'pending'`. Организатор видит список pending и нажимает Approve/Reject.
**Файлы:** tournamentController.js, routes/tournaments.js, api.js, tournaments.js, profile.js

### 7. Логотип команды
**Правило:** Генерируется из `name.substring(0, 3)` (первые 3 буквы).
**Должно быть везде:** teamController.js (create+update), teams.js, matches.js, statistics.js, tournaments.js

---

## Study папка

В проекте есть папка `study/` с 26 файлами на русском языке — объяснения каждого файла для защиты диплома:

| Файл | Содержание |
|------|-----------|
| 00_project_overview.md | Обзор проекта, порядок создания |
| 01-23_*.md | Каждый файл проекта объяснён с Q&A |
| 24_click_button_full_flow.md | Полный поток "кнопка → результат" |
| 25_email_service_and_forgot_password.md | Email и сброс пароля |
| 26_diploma_documentation_guide.md | Что писать в диплом |

---

## Важные архитектурные решения

1. **SPA (Single Page Application)** — один index.html, JS меняет видимость секций
2. **Layered Architecture** — Frontend → API Gateway → Business Logic → Data Access
3. **Stateless JWT** — сервер не хранит сессии, токен содержит всё нужное
4. **WebSocket rooms** — каждый турнир = своя комната, только участники получают события
5. **Vanilla JS без фреймворков** — чистый JavaScript, без React/Vue/Angular
6. **Модульная структура JS** — каждый файл = один модуль (Auth, Tournaments, Teams...)
7. **CSS переменные** — цвета и размеры в variables.css, легко менять тему
8. **Параметризованные SQL** — защита от инъекций через mysql2 prepared statements
9. **Email верификация** — нельзя войти без подтверждения email
10. **Crypto токены** — 32 случайных байта = 256 бит = невозможно подобрать

---

## Визуальный дизайн

- **Цветовая схема:** Тёмный фон (#0a0a0a), зелёный акцент (#2ecc71), белый текст
- **Фон:** Размытое изображение футбольного поля
- **Компоненты:** Карточки с `rgba(255,255,255,0.05)`, border-radius: 12px
- **Анимации:** CSS transitions на кнопках, hover эффекты
- **Responsive:** Media queries для мобильных устройств
- **Playoff bracket:** Flexbox колонки слева-направо, матчи распределены `justify-content: space-around`

---

## Среда разработки

- **ОС:** Windows 10
- **Shell:** Bash (через Git Bash / WSL)
- **Редактор:** VSCode + Live Server расширение
- **MySQL:** Установлен локально (CLI не в PATH — использовать Node.js mysql2)
- **Git:** Репозиторий в `c:/Users/arman/Desktop/11UNITY`
- **Ветка:** main
- **Команда запуска:** `cd backend && node server.js`
- **ВАЖНО:** В Windows bash `2>nul` создаёт файл `nul`. Использовать `2>/dev/null`

---

*Документ создан: 17 марта 2026*
*Проект: 11UNITY — Football Tournament Management System*
*Студент: Арман Вермишян, НПУА, группа СС219*
