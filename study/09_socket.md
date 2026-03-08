# 📁 Файлы: backend/socket/socketHandler.js + backend/socket/tournamentSocket.js

---

## Что такое WebSocket и зачем он нужен?

**Обычный HTTP запрос** — это как SMS:
```
Клиент: "Какой счёт?" → Сервер: "1:0"
Клиент: "Какой счёт?" → Сервер: "1:0"
Клиент: "Какой счёт?" → Сервер: "2:0"   ← клиент должен САМ спрашивать
```

**WebSocket** — это как телефонный звонок:
```
Клиент подключился ← постоянное соединение → Сервер
Сервер: "Гол! Счёт 1:0!" → клиент получает МГНОВЕННО
Сервер: "Гол! Счёт 2:0!" → клиент получает МГНОВЕННО
```

У нас Socket.IO — библиотека поверх WebSocket, добавляет удобные функции.

**Где используется в проекте:**
- Организатор добавил гол → все кто смотрят турнир видят изменение БЕЗ перезагрузки страницы
- Матч завершился → турнирная таблица обновляется у всех автоматически

---

# ЧАСТЬ 1: socketHandler.js — инициализация

## Глобальная переменная io:
```js
let io = null;  // let потому что значение изменится после initSocket()
```
`io` — это объект Socket.IO сервера. Хранится в модуле глобально чтобы другие файлы могли его использовать через `getIO()`.

---

## ФУНКЦИЯ 1: initSocket — запуск WebSocket сервера

```js
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',         // разрешить подключения с любого адреса
            methods: ['GET', 'POST']
        }
    });
```
Создаём Socket.IO сервер поверх HTTP сервера.
Тот же порт 3000 — и HTTP и WebSocket на одном порту.

### Middleware для JWT в Socket.IO:
```js
io.use((socket, next) => {
    const token = socket.handshake.auth.token;  // токен при подключении

    if (!token) {
        socket.user = null;  // анонимный пользователь — тоже разрешаем
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;  // сохраняем данные в объект socket
        next();
    } catch (error) {
        socket.user = null;
        next();  // даже с плохим токеном — пускаем (как анонима)
    }
});
```
Это то же самое что verifyToken в HTTP, но для WebSocket соединений.
`socket.handshake.auth.token` — токен который клиент отправляет при подключении.
`socket.user` — как `req.user` в HTTP middleware.

### Обработка подключений:
```js
io.on('connection', (socket) => {
    // socket = объект конкретного подключённого пользователя

    // Войти в "комнату" турнира:
    socket.on('tournament:join', (tournamentId) => {
        const room = `tournament:${tournamentId}`;
        socket.join(room);
    });

    // Выйти из комнаты:
    socket.on('tournament:leave', (tournamentId) => {
        socket.leave(room);
    });

    // При отключении:
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});
```

**Что такое "комнаты" (rooms)?**
Как группы в мессенджере. Пользователь заходит на страницу турнира №5 → подключается к комнате "tournament:5". Когда происходит событие в турнире 5 — сервер отправляет только в эту комнату, не всем.

```
Пользователь А смотрит турнир 5 → room "tournament:5"
Пользователь Б смотрит турнир 3 → room "tournament:3"

Гол в турнире 5 → io.to("tournament:5").emit(...)
Пользователь А получит событие, Б — нет!
```

### socket.on() vs io.on():
- `io.on('connection', ...)` — новое подключение (любой пользователь)
- `socket.on('event', ...)` — событие от КОНКРЕТНОГО подключённого клиента

---

## ФУНКЦИЯ 2: getIO — получить экземпляр
```js
const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
};
```
Другие файлы вызывают `getIO()` чтобы получить io и отправить событие.

---

## ФУНКЦИЯ 3: emitToTournament — отправить событие в комнату
```js
const emitToTournament = (tournamentId, event, data) => {
    if (!io) return;
    const room = `tournament:${tournamentId}`;
    io.to(room).emit(event, data);  // отправить всем в комнате
};
```
- `io.to(room)` — выбрать комнату
- `.emit(event, data)` — отправить событие с данными

---

# ЧАСТЬ 2: tournamentSocket.js — события турнира

## Что за события отправляем?

| Функция | Событие | Когда |
|---------|---------|-------|
| `emitScoreUpdate` | `match:score-update` | Матч завершился, счёт обновлён |
| `emitMatchEvent` | `match:event` | Добавлен гол/карточка |
| `emitStandingsUpdate` | `standings:update` | Таблица пересчитана |
| `emitStatisticsUpdate` | `statistics:update` | Статистика обновлена |

---

## ФУНКЦИЯ 1: emitScoreUpdate
```js
const emitScoreUpdate = (tournamentId, matchData) => {
    emitToTournament(tournamentId, 'match:score-update', {
        matchId: matchData.id,
        homeScore: matchData.home_score,
        awayScore: matchData.away_score,
        status: matchData.status,
        timestamp: new Date().toISOString()  // "2026-05-01T18:32:00.000Z"
    });
};
```
`new Date().toISOString()` — текущее время в ISO формате. Клиент знает КОГДА произошло событие.

---

## ФУНКЦИЯ 2: emitMatchEvent — гол/карточка
```js
const emitMatchEvent = (tournamentId, eventData) => {
    emitToTournament(tournamentId, 'match:event', {
        matchId: eventData.match_id,
        eventType: eventData.event_type,   // 'goal', 'yellow_card'...
        playerName: eventData.player_name,
        teamName: eventData.team_name,
        minute: eventData.minute
    });
};
```

---

## ФУНКЦИЯ 3: emitStandingsUpdate — обновить таблицу
```js
const emitStandingsUpdate = async (tournamentId) => {
    // Получаем свежую таблицу из БД
    const [standings] = await db.promise().query(`
        SELECT s.*, t.name as team_name, t.logo, t.logo_color
        FROM standings s
        INNER JOIN teams t ON s.team_id = t.id
        WHERE s.tournament_id = ?
        ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC
    `, [tournamentId]);

    // Отправляем всем в комнате турнира
    emitToTournament(tournamentId, 'standings:update', {
        standings,
        timestamp: new Date().toISOString()
    });
};
```
Эта функция `async` — потому что делает запрос к БД (нужен await).

---

## 📊 Полная схема работы WebSocket

```
СЕРВЕР                              КЛИЕНТ (браузер)
------                              ------
initSocket(httpServer)
                                    websocket.js подключается
io.on('connection')  ←─────────────  new Socket('http://localhost:3000')

                                    socket.emit('tournament:join', 5)
socket.join('tournament:5') ←──────

Организатор добавляет гол...
tournamentController.addMatchEvent()
    ↓
tournamentSocket.emitMatchEvent(5, {...})
    ↓
emitToTournament(5, 'match:event', data)
    ↓
io.to('tournament:5').emit('match:event', data)
                        ──────────────────────→  socket.on('match:event', data)
                                                 обновляем счёт на странице!
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `let io = null` | Глобальная переменная модуля, изменяется позже |
| `io.use(middleware)` | Middleware для Socket.IO (как app.use в Express) |
| `socket.handshake.auth` | Данные при подключении (токен) |
| `io.on('connection', fn)` | Слушать новые подключения |
| `socket.on('event', fn)` | Слушать событие от клиента |
| `socket.join(room)` | Войти в комнату |
| `io.to(room).emit(event, data)` | Отправить событие всем в комнате |
| `new Date().toISOString()` | Текущее время в ISO строке |

---

## ❓ Вопросы с защиты

**Q: Что такое WebSocket и чем отличается от HTTP?**
A: HTTP — запрос-ответ, соединение закрывается. WebSocket — постоянное двустороннее соединение. Сервер может сам отправлять данные клиенту без запроса. Используем для реал-тайм обновлений счёта и таблицы.

**Q: Что такое Socket.IO?**
A: Библиотека поверх WebSocket. Добавляет: автоматическое переподключение, комнаты (rooms), поддержку старых браузеров, middleware.

**Q: Зачем нужны комнаты (rooms)?**
A: Чтобы отправлять события только нужным пользователям. Кто смотрит турнир №5 — подключается к комнате "tournament:5". Событие из турнира 5 получат только они, не все пользователи сайта.

**Q: Почему Socket.IO использует тот же порт 3000 что и HTTP?**
A: Socket.IO создаётся поверх HTTP сервера. WebSocket начинается как HTTP запрос с заголовком Upgrade, потом переключается на ws:// протокол. Поэтому один порт.

**Q: Что происходит если клиент отключится?**
A: socket.on('disconnect') срабатывает автоматически. Socket.IO убирает его из всех комнат. При переподключении клиент снова делает tournament:join.
