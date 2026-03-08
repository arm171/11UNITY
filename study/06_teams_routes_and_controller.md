# 📁 Файлы: backend/routes/teams.js + backend/controllers/teamController.js

---

# ЧАСТЬ 1: routes/teams.js

## Все роуты команд:

```js
// ПУБЛИЧНЫЕ — без авторизации (любой может смотреть)
GET  /api/teams          → getTeams        (список всех команд)
GET  /api/teams/:id      → getTeamById     (одна команда по ID)

// ТОЛЬКО ДЛЯ ТРЕНЕРА — нужен токен + роль coach
POST   /api/teams                        → createTeam           (создать команду)
PUT    /api/teams/:id                    → updateTeam           (изменить команду)
DELETE /api/teams/:id                    → deleteTeam           (удалить команду)
GET    /api/teams/:teamId/players/search → searchPlayers        (поиск игроков)
POST   /api/teams/:teamId/players        → addPlayerToTeam      (добавить игрока)
DELETE /api/teams/:teamId/players/:playerId → removePlayerFromTeam (удалить игрока)

// ТОЛЬКО ДЛЯ ИГРОКА
POST /api/teams/leave → leaveTeam (игрок покидает команду)
```

**Что такое :id и :teamId?**
Это динамические параметры в URL.
`:id` в роуте = любое число в реальном запросе.
```
/api/teams/:id   ← шаблон
/api/teams/5     ← реальный запрос (id = 5)
/api/teams/42    ← реальный запрос (id = 42)
```
В контроллере достаём: `const { id } = req.params`

**Методы HTTP:**
- `GET` — получить данные (читать)
- `POST` — создать новое
- `PUT` — обновить существующее
- `DELETE` — удалить

---

# ЧАСТЬ 2: controllers/teamController.js

## Вспомогательная функция: isTeamInActiveTournament

```js
const isTeamInActiveTournament = async (teamId) => {
    const [rows] = await db.promise().query(
        `SELECT tt.id FROM tournament_teams tt
         INNER JOIN tournaments t ON tt.tournament_id = t.id
         WHERE tt.team_id = ? AND t.status = 'active'`,
        [teamId]
    );
    return rows.length > 0;  // true если нашли хоть одну строку
};
```
**Зачем:** Нельзя редактировать/удалять команду пока она в активном турнире.
Эта функция используется в нескольких местах — вынесена отдельно чтобы не повторяться.
**INNER JOIN** — соединить таблицы только где есть совпадение (в отличие от LEFT JOIN).

---

## ФУНКЦИЯ 1: getTeams — получить все команды

```js
const query = `
    SELECT
        t.*,                                    -- все поля из teams
        u.name as coach_name,                   -- имя тренера (из users)
        COUNT(DISTINCT tp.player_id) as players_count, -- количество игроков
        MAX(tn.name) as tournament_name,        -- название текущего турнира
        MAX(tn.id) as tournament_id             -- ID текущего турнира
    FROM teams t
    LEFT JOIN users u ON t.coach_id = u.id      -- присоединяем тренера
    LEFT JOIN team_players tp ON t.id = tp.team_id  -- присоединяем игроков
    LEFT JOIN tournament_teams tt ON t.id = tt.team_id  -- присоединяем участие в турнире
    LEFT JOIN tournaments tn ON tt.tournament_id = tn.id AND tn.status IN ('upcoming', 'active')
    GROUP BY t.id, u.name
    ORDER BY t.created_at DESC
`;
```

**LEFT JOIN** — присоединить таблицу. Если нет совпадения — поля будут NULL (не убирает строку).
**COUNT(DISTINCT tp.player_id)** — посчитать уникальных игроков в команде.
**MAX(tn.name)** — берём одно значение из группы (нужно из-за GROUP BY).
**GROUP BY t.id** — группируем по команде (чтобы COUNT работал правильно).
**ORDER BY t.created_at DESC** — сортируем: новые команды первыми.

---

## ФУНКЦИЯ 2: getTeamById — одна команда подробно

Делает 3 запроса к БД:

**Запрос 1** — данные команды (такой же JOIN как выше но с WHERE t.id = ?)

**Запрос 2** — список игроков команды:
```js
const [players] = await db.promise().query(
    `SELECT tp.player_id, tp.position, tp.jersey_number, u.name as player_name
     FROM team_players tp
     LEFT JOIN users u ON tp.player_id = u.id
     WHERE tp.team_id = ?
     ORDER BY tp.jersey_number`,
    [id]
);
```

**Запрос 3** — общая статистика команды по всем турнирам:
```js
const [stats] = await db.promise().query(
    `SELECT
        COALESCE(SUM(s.played), 0) as total_matches,
        COALESCE(SUM(s.won), 0) as total_wins,
        ...
     FROM standings s WHERE s.team_id = ?`,
    [id]
);
```
**COALESCE(значение, 0)** — если значение NULL → вернуть 0. Чтобы не было null в ответе.
**SUM()** — сумма всех значений.

**Собираем всё вместе:**
```js
const team = teams[0];
team.players = players;   // добавляем массив игроков к объекту команды
team.stats = stats[0];    // добавляем статистику
res.json({ success: true, team });
```

---

## ФУНКЦИЯ 3: createTeam — создать команду

**Шаги:**
```
1. Взять name, logoColor, description из req.body
2. coachId = req.user.id (из JWT токена, не из запроса!)
3. Валидация: name от 3 до 100 символов
4. Проверить: у этого тренера уже есть команда? → 409
5. Проверить: имя команды уже занято? → 409
6. Авто-генерация лого:
   name.trim().replace(/\s+/g, '').substring(0, 3).toUpperCase()
7. INSERT INTO teams
8. Вернуть 201 с данными команды
```

**Разбор генерации лого:**
```js
const logo = name.trim().replace(/\s+/g, '').substring(0, 3).toUpperCase();
```
- `.trim()` — убрать пробелы в начале и конце: `"  FC Real  "` → `"FC Real"`
- `.replace(/\s+/g, '')` — убрать ВСЕ пробелы: `"FC Real"` → `"FCReal"`
- `/\s+/g` — регулярное выражение: `\s` = пробел, `+` = один или больше, `g` = все вхождения
- `.substring(0, 3)` — первые 3 символа: `"FCR"`
- `.toUpperCase()` — все заглавные: `"FCR"`

**Зачем coachId берём из req.user а не из req.body?**
Безопасность! Если брать из req.body — злоумышленник мог бы указать чужой coachId.
req.user заполняется в verifyToken из JWT токена — его нельзя подделать.

---

## ФУНКЦИЯ 4: updateTeam — обновить команду

**Дополнительная проверка безопасности:**
```js
if (teams[0].coach_id !== userId) {
    return res.status(403).json({ message: 'Only the coach can update this team' });
}
```
Даже если у тебя есть роль coach — ты можешь обновлять ТОЛЬКО СВОЮ команду.
Проверяем что coach_id в БД совпадает с id из токена.

---

## ФУНКЦИЯ 5: deleteTeam — удалить команду

**Три проверки перед удалением:**
```
1. Команда существует?
2. Ты тренер этой команды?
3. В команде есть игроки? → нельзя удалить (сначала убери игроков)
4. Команда в турнире? → нельзя удалить
```

---

## ФУНКЦИЯ 6: searchPlayers — поиск игроков

```js
const searchTerm = `%${query.trim()}%`;  // "ivan" → "%ivan%"

SELECT u.id, u.name, u.email,
    CASE
        WHEN tp.team_id IS NOT NULL THEN true
        ELSE false
    END as has_team
FROM users u
LEFT JOIN team_players tp ON u.id = tp.player_id
WHERE u.role = 'player' AND (u.name LIKE ? OR u.email LIKE ?)
LIMIT 10
```
- `LIKE '%ivan%'` — найти все строки содержащие "ivan"
- `%` — любые символы (wildcard)
- `CASE WHEN ... THEN ... ELSE ... END` — условие в SQL (как if/else)
- `has_team` — показывает занят ли игрок

---

## ФУНКЦИЯ 7: addPlayerToTeam — добавить игрока

**8 проверок перед добавлением:**
```
1. Все поля заполнены? (playerId, jerseyNumber, position)
2. Команда существует?
3. Ты тренер этой команды?
4. Команда в активном турнире? → нельзя менять состав
5. Пользователь существует?
6. Роль пользователя = player?
7. Игрок уже в другой команде? → нельзя
8. Команда заполнена (>= 25 игроков)? → нельзя
9. Номер майки занят?
10. Номер майки от 1 до 99?
11. Позиция валидная?
```

---

## ФУНКЦИЯ 8: removePlayerFromTeam — убрать игрока (тренер)
## ФУНКЦИЯ 9: leaveTeam — покинуть команду (сам игрок)

Отличие:
- `removePlayerFromTeam` — тренер убирает конкретного игрока (teamId + playerId из params)
- `leaveTeam` — игрок уходит сам (playerId берётся из req.user.id)

---

## 🔑 JS и SQL концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `req.params` | Параметры из URL: `/teams/:id` → `req.params.id` |
| `req.query` | Параметры после `?`: `/search?query=ivan` → `req.query.query` |
| `req.body` | Тело POST/PUT запроса (JSON) |
| `req.user` | Данные из JWT токена (заполняется в verifyToken) |
| `.trim()` | Убрать пробелы по краям строки |
| `.replace(/regex/g, '')` | Заменить по регулярному выражению |
| `.substring(0, 3)` | Взять первые N символов |
| `.toUpperCase()` | Перевести в верхний регистр |
| `LEFT JOIN` | SQL: присоединить таблицу (NULL если нет совпадения) |
| `INNER JOIN` | SQL: присоединить таблицу (убрать строки без совпадения) |
| `COUNT(DISTINCT x)` | SQL: посчитать уникальные значения |
| `COALESCE(x, 0)` | SQL: если NULL — вернуть 0 |
| `LIKE '%text%'` | SQL: поиск по вхождению подстроки |
| `CASE WHEN THEN ELSE END` | SQL: условие (как if/else) |

---

## ❓ Вопросы с защиты

**Q: Почему coachId берём из req.user, а не из req.body?**
A: Безопасность. req.body приходит от клиента — его можно подделать. req.user заполняется сервером из JWT токена — подделать нельзя.

**Q: Что такое req.params?**
A: Динамические части URL. В роуте `/:id` — при запросе `/5` значение `req.params.id` будет `"5"`.

**Q: Зачем проверять coach_id === userId если уже есть checkRole('coach')?**
A: checkRole проверяет только что у пользователя роль coach. Но не что эта команда ЕГО. Без этой проверки любой тренер мог бы удалить команду другого тренера.

**Q: Почему нельзя удалить команду с игроками?**
A: Бизнес-логика. Игроки связаны с матчами, статистикой. Нельзя просто удалить — потеряются данные. Сначала нужно убрать всех игроков.

**Q: Что такое LEFT JOIN и чем отличается от INNER JOIN?**
A: LEFT JOIN возвращает все строки из левой таблицы, даже если нет совпадения справа (тогда NULL). INNER JOIN возвращает только строки где есть совпадение с обеих сторон.

**Q: Зачем MAX() вокруг tournament_name?**
A: Из-за GROUP BY. MySQL требует что все неагрегированные колонки должны быть в GROUP BY или обёрнуты в агрегатную функцию (MAX, MIN, SUM...). Это называется ONLY_FULL_GROUP_BY режим.
