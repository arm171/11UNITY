# 📁 Оставшиеся backend файлы: matches.js, profile.js, statistics.js, package.json, backup.bat

---

## 1. backend/routes/matches.js — самый короткий файл проекта

```js
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

router.get('/', tournamentController.getAllMatches);

module.exports = router;
```

Всего 3 строки логики. Маршрут `GET /api/matches` просто вызывает `getAllMatches` из `tournamentController`.

**Почему логика в tournamentController?**
Матчи создаются генератором расписания при создании турнира. Вся логика матчей (создание, обновление счёта, события) была уже в `tournamentController.js`. Выносить в отдельный `matchController` не потребовалось — функция одна.

Путь в системе:
```
GET /api/matches
    → server.js: app.use('/api/matches', matchesRouter)
    → matches.js: router.get('/')
    → tournamentController.getAllMatches()
```

---

## 2. backend/routes/profile.js — два маршрута, три роли

Файл 244 строки. Логика прямо в routes (без отдельного controller).

### Маршрут 1: GET /api/profile/stats

```js
router.get('/stats', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'player') { ... }
    else if (role === 'coach') { ... }
    else if (role === 'organizer') { ... }
});
```

Один маршрут — три разных ответа в зависимости от роли пользователя.
`req.user` доступен благодаря `verifyToken` middleware (декодированный JWT).

### Роль: player — 4 запроса к БД

```js
// 1. Команда игрока
const [teamInfo] = await db.promise().query(`
    SELECT tp.position, tp.jersey_number, t.id as team_id, ...
    FROM team_players tp
    INNER JOIN teams t ON tp.team_id = t.id
    WHERE tp.player_id = ?
`, [userId]);

// 2. Голы и карточки из match_events
const [stats] = await db.promise().query(`
    SELECT
        COALESCE(SUM(CASE WHEN me.event_type = 'goal' AND me.is_own_goal = 0 THEN 1 ELSE 0 END), 0) as goals,
        COALESCE(SUM(CASE WHEN me.event_type = 'yellow_card' THEN 1 ELSE 0 END), 0) as yellow_cards,
        COALESCE(SUM(CASE WHEN me.event_type = 'red_card' THEN 1 ELSE 0 END), 0) as red_cards
    FROM match_events me
    WHERE me.player_id = ?
`, [userId]);

// 3. Ассисты (записи где assist_player_id = этот игрок)
const [assistStats] = await db.promise().query(`
    SELECT COUNT(*) as assists
    FROM match_events me
    WHERE me.assist_player_id = ? AND me.event_type = 'goal'
`, [userId]);

// 4. Последние 5 матчей его команды
const [matches] = await db.promise().query(`
    SELECT ... FROM matches m
    WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.status = 'finished'
    ORDER BY m.match_date DESC
    LIMIT 5
`, [teamId, teamId]);
```

**`CASE WHEN ... THEN 1 ELSE 0 END`** — условное суммирование:
```sql
SUM(CASE WHEN event_type = 'goal' AND is_own_goal = 0 THEN 1 ELSE 0 END)
-- Для каждой строки: если гол не автогол → считаем +1, иначе +0
-- SUM суммирует все единицы → итого голов
```
Аналог `COUNT(IF(...))` но стандартный SQL.

**`COALESCE(expr, 0)`** — вернуть 0 вместо NULL:
```sql
-- Если игрок не забивал, SUM вернёт NULL
COALESCE(NULL, 0)  → 0
COALESCE(5, 0)     → 5  (не NULL — вернуть как есть)
```

### Роль: coach — данные команды

```js
// Команда с количеством игроков
const [teams] = await db.promise().query(`
    SELECT t.*, COUNT(DISTINCT tp.player_id) as players_count
    FROM teams t
    LEFT JOIN team_players tp ON t.id = tp.team_id
    WHERE t.coach_id = ?
    GROUP BY t.id
`, [userId]);

// Запись команды из таблицы standings (суммируем все турниры)
const [recordData] = await db.promise().query(`
    SELECT
        COALESCE(SUM(s.played), 0) as total_matches,
        COALESCE(SUM(s.won), 0) as wins,
        COALESCE(SUM(s.drawn), 0) as draws,
        COALESCE(SUM(s.lost), 0) as losses
    FROM standings s WHERE s.team_id = ?
`, [team.id]);
```

`SUM(s.won)` суммирует победы команды по всем турнирам. Если команда участвовала в 3 турнирах — суммируются standings из всех трёх.

### Роль: organizer — сортировка по статусу

```sql
ORDER BY
    CASE WHEN t.status = 'active' THEN 0
         WHEN t.status = 'upcoming' THEN 1
         ELSE 2 END,
    t.created_at DESC
```

**CASE в ORDER BY** — кастомный порядок сортировки:
- active → 0 (первые)
- upcoming → 1 (вторые)
- finished → 2 (последние)
- Внутри каждой группы — по дате создания (новые первыми)

```js
// Считаем количества через filter в JS (не в SQL)
const counts = {
    total: tournaments.length,
    active: tournaments.filter(t => t.status === 'active').length,
    upcoming: tournaments.filter(t => t.status === 'upcoming').length,
    finished: tournaments.filter(t => t.status === 'finished').length
};
```

Данные уже загружены — считаем через JS `filter().length` вместо дополнительных SQL запросов.

### Маршрут 2: PUT /api/profile/update

```js
router.put('/update', verifyToken, async (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body;
```

**Динамическое построение UPDATE запроса:**
```js
let updateFields = [];
let updateValues = [];

if (name && name.trim()) {
    updateFields.push('name = ?');
    updateValues.push(name.trim());
}
if (email && email.trim()) {
    updateFields.push('email = ?');
    updateValues.push(email.trim());
}
if (newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    updateFields.push('password = ?');
    updateValues.push(hashedPassword);
}

// updateFields.join(', ') → 'name = ?, email = ?'
updateValues.push(userId);
await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
```

Вместо одного огромного UPDATE с кучей NULL — строим запрос из только тех полей которые реально меняются.
`updateFields.join(', ')` → `'name = ?, email = ?'`

**Безопасность при смене пароля:**
```js
// 1. Проверить текущий пароль
const isValid = await bcrypt.compare(currentPassword, user.password);
if (!isValid) return res.status(400).json({ message: 'Current password is incorrect' });

// 2. Проверить длину нового
if (newPassword.length < 6) return res.status(400).json({...});

// 3. Хэшировать новый
const hashedPassword = await bcrypt.hash(newPassword, 10);
```

Три проверки перед изменением пароля. `bcrypt.compare(plain, hash)` — сравнивает без расшифровки хэша.

**Проверка уникальности email:**
```sql
SELECT id FROM users WHERE email = ? AND id != ?
```
`AND id != userId` — исключает самого пользователя. Иначе он получал бы ошибку "email занят" при сохранении своего же email.

---

## 3. backend/routes/statistics.js — три маршрута

### GET /api/statistics — глобальная статистика

```js
const [
    [tournamentsResult],
    [teamsResult],
    [matchesResult],
    [playersResult],
    [goalsResult]
] = await Promise.all([
    db.promise().query('SELECT COUNT(*) as count FROM tournaments'),
    db.promise().query('SELECT COUNT(*) as count FROM teams'),
    db.promise().query('SELECT COUNT(*) as count FROM matches'),
    db.promise().query('SELECT COUNT(*) as count FROM users WHERE role = "player"'),
    db.promise().query(`SELECT COUNT(*) as count FROM match_events WHERE event_type = 'goal'`)
]);
```

5 запросов параллельно через `Promise.all`. Каждый запрос возвращает `[[rows], fields]`.

**Двойная деструктуризация:**
```js
const [[tournamentsResult]] = ...
// Внешние [] — деструктурируем Promise.all (массив результатов)
// Внутренние [] — из каждого результата берём только rows (без fields)
```

После этого:
```js
tournamentsResult[0].count  // → 5 (количество турниров)
teamsResult[0].count        // → 12 (количество команд)
```

### GET /api/statistics/tournament/:id — статистика турнира

```js
const { id } = req.params;  // из URL: /statistics/tournament/3  → id = '3'
```

**Сортировка standings с тайбрейкером:**
```sql
ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC, t.name ASC
```

При одинаковых очках (s.points):
1. Смотрим разницу голов (goal_difference)
2. Если тоже равно — голы забитые
3. Если и это равно — алфавит (name)

Стандартные футбольные правила определения мест в таблице.

### GET /api/statistics/tournaments — список для дропдауна

```sql
ORDER BY
    CASE WHEN status = 'active' THEN 0 WHEN status = 'upcoming' THEN 1 ELSE 2 END,
    created_at DESC
```

Та же сортировка что в profile.js — активные первые, завершённые последние.

---

## 4. backend/package.json — зависимости проекта

```json
{
    "name": "11unity-backend",
    "version": "1.0.0",
    "main": "server.js",
    "type": "commonjs",
    "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js"
    },
    "dependencies": {
        "bcryptjs": "^3.0.3",
        "cors": "^2.8.5",
        "dotenv": "^17.2.3",
        "express": "^5.1.0",
        "jsonwebtoken": "^9.0.2",
        "mysql2": "^3.15.3",
        "socket.io": "^4.8.3"
    }
}
```

### Каждая зависимость и зачем она нужна

| Пакет | Версия | Для чего |
|-------|--------|---------|
| `express` | 5.1.0 | Веб-фреймворк — маршруты, middleware, HTTP сервер |
| `mysql2` | 3.15.3 | Драйвер MySQL — подключение к БД, SQL запросы |
| `bcryptjs` | 3.0.3 | Хэширование паролей — bcrypt.hash(), bcrypt.compare() |
| `jsonwebtoken` | 9.0.2 | JWT токены — jwt.sign(), jwt.verify() |
| `cors` | 2.8.5 | CORS заголовки — разрешить запросы с другого порта (frontend) |
| `dotenv` | 17.2.3 | Чтение .env файла — process.env.DB_PASSWORD и т.д. |
| `socket.io` | 4.8.3 | WebSocket — реал-тайм события матчей |

### `"type": "commonjs"`

```js
// CommonJS (используется в проекте):
const express = require('express');
module.exports = router;

// ES Modules (альтернатива):
import express from 'express';
export default router;
```

`"type": "commonjs"` означает что Node.js трактует все `.js` файлы как CommonJS.
Без этого поля — Node.js 12+ по умолчанию тоже CommonJS, но явное указание убирает путаницу.

### Скрипты

```json
"scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
}
```

```bash
npm start   # → node server.js (продакшн запуск)
npm run dev # → nodemon server.js (разработка с автоперезапуском)
```

**nodemon** — не в зависимостях проекта (должен быть установлен глобально `npm i -g nodemon`).
Следит за изменениями файлов и перезапускает сервер автоматически.

### `^` в версиях (caret)

```json
"express": "^5.1.0"
```

`^5.1.0` = принимать `5.x.x` где x ≥ 1 (только patch и minor обновления, не major).
`npm install` установит совместимую версию, не сломает API.

---

## 5. backup.bat — скрипт резервного копирования

```bat
@echo off
echo 🔄 Starting backup...
git add .
git commit -m "daily: Work progress %date% %time%"
git push
echo ✅ Backup complete!
pause
```

**Windows Batch (.bat) скрипт:**

| Команда | Что делает |
|---------|-----------|
| `@echo off` | Не показывать сами команды в терминале (только вывод) |
| `echo текст` | Вывести текст в консоль |
| `git add .` | Добавить все изменённые файлы в staging |
| `git commit -m "..."` | Создать коммит с сообщением |
| `%date% %time%` | Встроенные переменные Windows — текущие дата и время |
| `git push` | Отправить в GitHub (резервная копия в облаке) |
| `pause` | Ждать нажатия клавиши перед закрытием |

**Зачем:** Двойной клик по backup.bat → автоматически сохраняет весь прогресс в git + GitHub.
Вместо того чтобы каждый раз вручную писать `git add`, `git commit`, `git push`.

Пример созданного коммита: `daily: Work progress 24.02.2026 12:28:28,63`

---

## Общая архитектура backend — итоговая схема

```
server.js (точка входа)
├── Middleware: cors, express.json(), verifyToken
├── Routes:
│   ├── /api/auth        → routes/auth.js → authController.js
│   ├── /api/teams       → routes/teams.js → teamController.js
│   ├── /api/tournaments → routes/tournaments.js → tournamentController.js
│   ├── /api/matches     → routes/matches.js → tournamentController.getAllMatches
│   ├── /api/profile     → routes/profile.js (логика прямо здесь)
│   └── /api/statistics  → routes/statistics.js (логика прямо здесь)
├── Socket.IO: socket.js
└── config/database.js (пул MySQL соединений)
```

**Три паттерна организации маршрутов:**
1. `routes + controller` — auth, teams, tournaments (сложная логика вынесена)
2. `routes only` — profile, statistics (логика прямо в routes, без controller)
3. `routes → другой controller` — matches (минимальный файл, делегирует tournamentController)

---

## 🔑 Концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `CASE WHEN ... THEN 1 ELSE 0 END` в SUM | Условное суммирование в SQL |
| `COALESCE(expr, 0)` | Заменить NULL на 0 |
| `ORDER BY CASE WHEN...` | Кастомный порядок сортировки в SQL |
| `Promise.all` с двойной деструктуризацией | `const [[rows]] = await Promise.all([...])` |
| Динамическое построение UPDATE | Массивы updateFields + updateValues, `join(', ')` |
| `bcrypt.compare(plain, hash)` | Проверка пароля без расшифровки |
| `AND id != userId` в проверке email | Исключить самого себя из проверки уникальности |
| `"type": "commonjs"` в package.json | CommonJS vs ES Modules |
| `^версия` в package.json | Caret = принимать minor обновления |
| `npm start` vs `npm run dev` | node vs nodemon |
| Windows Batch скрипт `.bat` | Автоматизация git backup |
| `%date% %time%` | Переменные Windows в bat файлах |

---

## ❓ Вопросы с защиты

**Q: Почему profile.js не имеет отдельного controller файла?**
A: Это дизайн-решение. Routes файл может содержать логику напрямую — это валидно для небольших или самостоятельных модулей. Контроллеры выносятся когда логика большая и сложная (как tournaments). Profile — два маршрута, логика понятна в одном файле.

**Q: Как работает CASE WHEN в SQL для подсчёта голов?**
A: `SUM(CASE WHEN event_type='goal' AND is_own_goal=0 THEN 1 ELSE 0 END)`. Для каждой строки match_events SQL проверяет условие: если это гол не автогол — считаем 1, иначе 0. SUM суммирует все единицы. Автоголы не засчитываются забившему игроку.

**Q: Зачем `AND id != ?` при проверке уникальности email?**
A: Если Arman хочет сохранить профиль с тем же email, запрос `SELECT id FROM users WHERE email = ?` найдёт его самого. Без `AND id != userId` он получит ошибку "email занят" при сохранении своих же данных. Условие исключает текущего пользователя из проверки.

**Q: Что делает `^` перед версией в package.json?**
A: Caret (^) означает "совместимые обновления". `^5.1.0` разрешает версии 5.1.0 до 5.9.9 (minor и patch), но не 6.0.0 (major). Major версии ломают API — их не обновляют автоматически.

**Q: Для чего backup.bat?**
A: Автоматизация ежедневного сохранения. Двойной клик — и всё сохранено на GitHub. Вместо ручного git add + commit + push. Коммит содержит дату и время — можно найти любой день в истории.

**Q: Как работает двойная деструктуризация в statistics.js?**
A: `mysql2` возвращает `[rows, fields]`. `Promise.all` возвращает массив таких результатов. `const [[t],[tm],[m],[p],[g]] = await Promise.all([...])` — внешние [] распаковывают Promise.all, внутренние [] берут только rows из каждого результата, пропуская fields.
