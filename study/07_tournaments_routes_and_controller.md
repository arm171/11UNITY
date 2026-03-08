# 📁 Файлы: backend/routes/tournaments.js + backend/controllers/tournamentController.js

Это САМЫЙ большой контроллер в проекте — 1530 строк. Отвечает за всё что связано с турнирами.

---

# ЧАСТЬ 1: routes/tournaments.js

## Все роуты:

```
ПУБЛИЧНЫЕ (без токена):
GET  /api/tournaments                              → список всех турниров
GET  /api/tournaments/:id/matches                  → матчи турнира
GET  /api/tournaments/:id/standings                → турнирная таблица
GET  /api/tournaments/:id/statistics               → статистика игроков
GET  /api/tournaments/:tournamentId/matches/:matchId → детали матча

ТОЛЬКО ОРГАНИЗАТОР:
POST   /api/tournaments                            → создать турнир
PUT    /api/tournaments/:id                        → обновить турнир
DELETE /api/tournaments/:id                        → удалить турнир
POST   /api/tournaments/:id/fixtures/preview       → предпросмотр расписания
POST   /api/tournaments/:id/fixtures/generate      → генерировать матчи
PUT    /api/tournaments/:tournamentId/matches/:matchId    → обновить статус матча
POST   /api/tournaments/:tournamentId/matches/:matchId/events    → добавить событие
DELETE /api/tournaments/:tournamentId/matches/:matchId/events/:eventId → удалить событие

ТОЛЬКО ТРЕНЕР:
POST /api/tournaments/:id/join          → войти в турнир
POST /api/tournaments/:id/leave         → выйти из турнира
GET  /api/tournaments/:id/check-joined  → проверить вошёл ли
```

---

# ЧАСТЬ 2: tournamentController.js

## Константы в начале файла:
```js
const VALID_MAX_TEAMS = {
    league: [4, 8, 12, 16, 32],
    playoff: [4, 8, 16, 32],
    group_playoff: [8, 16, 32]
};
const VALID_MIN_PLAYERS = [7, 9, 11];
```
Это объект-конфигурация. Определяет сколько команд допустимо для каждого типа турнира.
Зачем константы вверху: используются в нескольких функциях, легко изменить в одном месте.

---

## ФУНКЦИЯ 1: getTournaments — список турниров

```js
const getTournaments = async (req, res) => {
    const { category } = req.query;  // ?category=school (необязательный фильтр)

    let query = `SELECT t.*, u.name as organizer_name, COUNT(DISTINCT tt.team_id) as teams_count
                 FROM tournaments t
                 LEFT JOIN users u ON t.organizer_id = u.id
                 LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id`;

    const params = [];

    if (category && ['school', 'university', 'amateur'].includes(category)) {
        query += ' WHERE t.category = ?';  // динамически добавляем фильтр
        params.push(category);
    }

    query += ' GROUP BY t.id ORDER BY t.created_at DESC';
```

**Динамический SQL запрос** — запрос строится во время выполнения.
Если передан параметр category → добавляем WHERE. Если нет → без фильтра.
`let query` (не const) — потому что строка изменяется.
`params.push(category)` — добавляем параметр в массив для placeholder `?`.

---

## ФУНКЦИЯ 2: createTournament — создать турнир

**Валидации (7 штук):**
```
1. Обязательные поля: name, type, startDate, maxTeams
2. Длина названия: 3-255 символов
3. Тип: только league/playoff/group_playoff
4. Категория: только school/university/amateur
5. maxTeams соответствует типу турнира (из VALID_MAX_TEAMS)
6. minPlayersPerTeam: только 7, 9 или 11
7. Дата начала в будущем
```

**Проверка даты:**
```js
const start = new Date(startDate);  // строку "2026-05-01" → объект Date
const now = new Date();
now.setHours(0, 0, 0, 0);          // обнуляем время (сравниваем только даты)

if (start < now) { ... }  // дата в прошлом → ошибка
```
`new Date()` — создать объект даты. В JS дату можно сравнивать операторами < > ===.
`.setHours(0, 0, 0, 0)` — установить часы=0, минуты=0, секунды=0, миллисекунды=0.

**Ограничение: один незавершённый турнир:**
```js
const [unfinished] = await db.promise().query(
    `SELECT id FROM tournaments WHERE organizer_id = ? AND status IN ('upcoming', 'active')`,
    [organizerId]
);
if (unfinished.length > 0) { return 400 ... }
```
Организатор не может создать новый турнир пока предыдущий не завершён.

---

## ФУНКЦИЯ 3 & 4: updateTournament & deleteTournament

Общий паттерн защиты (используется везде):
```js
// 1. Найти турнир
const [tournaments] = await db.promise().query('SELECT organizer_id, status FROM tournaments WHERE id = ?', [id]);

// 2. Существует?
if (tournaments.length === 0) return 404

// 3. Ты создатель?
if (tournaments[0].organizer_id !== userId) return 403

// 4. Статус подходящий?
if (tournaments[0].status !== 'upcoming') return 400
// Менять/удалять можно только upcoming. Active и finished — нельзя!
```

---

## ФУНКЦИЯ 5: joinTournament — команда вступает в турнир

**Проверки:**
```
1. У тренера есть команда?
2. Турнир существует и upcoming?
3. Команда уже в другом активном/upcoming турнире? → нельзя (одновременно в одном)
4. Турнир заполнен (teams_count >= max_teams)?
```
Если всё ок: `INSERT INTO tournament_teams (tournament_id, team_id)`

---

## ФУНКЦИЯ 6: previewFixtures — предпросмотр расписания

Показывает как будет выглядеть расписание матчей БЕЗ сохранения в БД.
```js
const fixturesGenerator = require('../helpers/fixturesGenerator');

const rounds = fixturesGenerator.generateRoundRobinDouble(teams);
const scheduledMatches = fixturesGenerator.scheduleMatches(rounds, settings);
```
Использует отдельный файл `helpers/fixturesGenerator.js` — алгоритм генерации матчей.
Его изучим отдельно.

**Группировка по раундам:**
```js
const roundsMap = {};
scheduledMatches.forEach(match => {
    if (!roundsMap[match.round]) {
        roundsMap[match.round] = { round: match.round, matches: [] };
    }
    roundsMap[match.round].matches.push({ team1: ..., team2: ... });
});
Object.values(roundsMap).forEach(round => schedule.push(round));
```
Превращаем плоский массив матчей в объект сгруппированный по раундам.
`forEach` — перебрать каждый элемент массива.
`Object.values(obj)` — получить все значения объекта как массив.

---

## ФУНКЦИЯ 7: generateFixtures — генерация матчей (КЛЮЧЕВАЯ!)

Когда организатор жмёт "Старт турнира" — происходит это:

```
1. Проверки (upcoming, организатор, матчей ещё нет)
2. Получить команды с кол-вом игроков
3. Проверить что у каждой команды >= min_players_per_team
4. generateRoundRobinDouble(teams) → массив раундов
5. scheduleMatches(rounds, settings) → массив с датами
6. for (const match of scheduledMatches) → INSERT каждый матч в БД
7. initializeStandings() → создать записи в standings (все по нулям)
8. UPDATE tournaments SET status = 'active'
```

**Цикл for...of:**
```js
for (const match of scheduledMatches) {
    await db.promise().query('INSERT INTO matches ...', [...]);
}
```
`for...of` — перебрать каждый элемент массива. Работает с `await` (в отличие от forEach!).

После этого турнир становится ACTIVE и матчи нельзя изменить.

---

## ФУНКЦИЯ 8: updateMatchResult — завершить матч

Самая сложная функция. Когда статус меняется на 'finished':

```js
if (status === 'finished') {
    // 1. Получить все события-голы этого матча
    const [goalEvents] = await db.promise().query(
        `SELECT team_id, is_own_goal FROM match_events WHERE match_id = ? AND event_type = 'goal'`
    );

    // 2. Посчитать счёт (учитывая автоголы!)
    let team1Score = 0, team2Score = 0;
    for (const event of goalEvents) {
        if (event.is_own_goal) {
            // автогол идёт ПРОТИВНИКУ
            if (event.team_id === matches[0].team1_id) team2Score++;
            else team1Score++;
        } else {
            if (event.team_id === matches[0].team1_id) team1Score++;
            else team2Score++;
        }
    }

    // 3. В плейофф ничья запрещена
    if (tournamentType === 'playoff' && team1Score === team2Score) return 400

    // 4. Сохранить счёт
    // 5. recalculateStandings() — пересчитать таблицу
    // 6. recalculatePlayerStatistics() — пересчитать статистику
    // 7. checkAndFinishTournament() — если все матчи finished → турнир finished
    // 8. Отправить WebSocket событие (реал-тайм обновление!)
}
```

**Счёт считается автоматически из событий — не вводится вручную!**

---

## ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (внутренние, не экспортируются):

### initializeStandings
```js
const initializeStandings = async (tournamentId) => {
    const [teams] = await db.promise().query('SELECT team_id FROM tournament_teams WHERE tournament_id = ?', [...]);
    for (const team of teams) {
        await db.promise().query(
            'INSERT IGNORE INTO standings (tournament_id, team_id, played, ...) VALUES (?, ?, 0, ...)',
            [tournamentId, team.team_id]
        );
    }
};
```
`INSERT IGNORE` — вставить, но если уже есть (UNIQUE KEY) — не выдавать ошибку, игнорировать.

### recalculateStandings
```js
// 1. Обнулить все standings
// 2. Получить все завершённые матчи
// 3. Для каждого матча пересчитать очки:
if (team1_score > team2_score) {
    team1Points = 3; team1Won = 1; team2Lost = 1;   // победа = 3 очка
} else if (team1_score < team2_score) {
    team2Points = 3; team2Won = 1; team1Lost = 1;
} else {
    team1Points = 1; team2Points = 1; team1Draw = 1; team2Draw = 1;  // ничья = 1 очко
}
// 4. UPDATE standings для каждой команды
```
Почему пересчитываем с нуля а не инкрементируем?
Надёжнее. Если был изменён результат матча — старые очки не накапливаются.

### checkAndFinishTournament
```js
const [result] = await db.promise().query(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished
    FROM matches WHERE tournament_id = ?
`);

if (result[0].total === result[0].finished) {
    // все матчи завершены → турнир автоматически завершается
    UPDATE tournaments SET status = 'finished'
}
```
Автоматическое завершение турнира — организатор не должен нажимать кнопку вручную.

### recalculatePlayerStatistics
```js
const playerStats = {};  // объект: ключ = "playerId_teamId", значение = { goals, assists, ... }

const getKey = (playerId, teamId) => `${playerId}_${teamId}`;
// "5_3" = игрок id=5, команда id=3

const ensurePlayer = (playerId, teamId) => {
    const key = getKey(playerId, teamId);
    if (!playerStats[key]) {
        playerStats[key] = { goals: 0, assists: 0, ... };  // создаём если нет
    }
    return playerStats[key];
};

for (const event of events) {
    const stats = ensurePlayer(event.player_id, event.team_id);
    if (event.event_type === 'goal') stats.goals++;
    if (event.event_type === 'yellow_card') stats.yellow_cards++;
    // и т.д.
}

// После подсчёта — массовая вставка в БД
for (const stats of Object.values(playerStats)) {
    await db.promise().query('INSERT INTO player_statistics ...', [...]);
}
```
Паттерн "накопить в памяти, потом записать в БД" — эффективнее чем UPDATE для каждого события.

---

## 🔑 Новые JS концепции в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `let` вместо `const` | Когда значение нужно изменить (query строится динамически) |
| `new Date(string)` | Создать объект даты из строки |
| `.setHours(0,0,0,0)` | Обнулить время в объекте даты |
| `for...of` | Перебор массива, работает с await |
| `.forEach(item => {})` | Перебор массива, НЕ работает с await |
| `Object.values(obj)` | Получить все значения объекта как массив |
| Template literal | `` `${playerId}_${teamId}` `` — строка из переменных |
| `array.filter(fn)` | Отфильтровать массив по условию |
| `array.map(fn)` | Преобразовать каждый элемент массива |
| `x?.property` | Optional chaining — если x null, не падать |

---

## 📊 Жизненный цикл турнира

```
СОЗДАНИЕ (organizer)
    ↓
status = 'upcoming'
    ↓
Команды вступают (coach) → JOIN tournament_teams
    ↓
Организатор генерирует матчи → generateFixtures()
    ↓
status = 'active'
    ↓
Матчи проводятся, организатор добавляет события (голы, карточки)
    ↓
Матч завершается → updateMatchResult('finished')
    ↓
recalculateStandings() + recalculatePlayerStatistics()
    ↓
Все матчи finished → checkAndFinishTournament()
    ↓
status = 'finished' (автоматически!)
```

---

## ❓ Вопросы с защиты

**Q: Как считается счёт матча?**
A: Автоматически из match_events. Организатор добавляет голы как события, при завершении матча система считает количество голов каждой команды. Вручную счёт не вводится.

**Q: Что такое автогол и как он обрабатывается?**
A: is_own_goal = true. Если команда team1 забила автогол — очко идёт team2. Логика перевёрнута: event.team_id === team1_id, но очко получает team2.

**Q: Почему standings пересчитываются с нуля после каждого матча?**
A: Надёжность. Если организатор ошибся и исправил событие — старые очки не накопятся. Полный пересчёт гарантирует корректность.

**Q: Как турнир автоматически завершается?**
A: checkAndFinishTournament() считает total матчей и finished матчей. Если равны — UPDATE status='finished'. Вызывается после каждого завершённого матча.

**Q: Почему нельзя использовать forEach с await?**
A: forEach не ждёт завершения async операций. for...of ждёт каждый await перед следующей итерацией. Поэтому вставку матчей делаем через for...of.

**Q: Что такое динамический SQL запрос?**
A: Запрос который строится в зависимости от условий. Например если передан category — добавляем WHERE. Если нет — запрос без WHERE. Используем let query и params.push().

**Q: Почему организатор может управлять только своим турниром?**
A: Проверка organizer_id !== userId. Даже если у пользователя роль organizer — он может менять только свои турниры.
