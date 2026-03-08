# 📁 Файл: frontend/js/websocket.js

## Что это такое?
Модуль реального времени на frontend'е. Подключается к Socket.IO серверу и слушает события:
- Обновление счёта матча
- Голы, карточки (match events)
- Обновление таблицы (standings)
- Обновление статистики

Когда организатор вводит гол на сервере → WebSocket мгновенно обновляет страницу у ВСЕХ зрителей.

---

## СТРУКТУРА объекта

```js
const WebSocketManager = {
    socket: null,               // объект Socket.IO соединения
    currentTournamentId: null,  // в какой комнате сейчас сидим
    reconnectAttempts: 0,       // сколько раз пробовали переподключиться
    maxReconnectAttempts: 5,    // максимум попыток
};
```

---

## ФУНКЦИЯ: connect() — подключение к серверу

```js
connect() {
    const wsUrl = CONFIG.WS_URL || CONFIG.API_URL.replace('/api', '');
    // wsUrl = 'http://localhost:3000' (без /api)

    this.socket = io(wsUrl, {
        auth: {
            token: API.getToken()  // JWT токен для авторизации
        },
        reconnection: true,               // автоматически переподключаться
        reconnectionAttempts: 5,          // максимум попыток
        reconnectionDelay: 1000,          // ждать 1с перед попыткой
        reconnectionDelayMax: 5000        // максимальная задержка 5с
    });

    // Событие: успешно подключились
    this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        if (this.currentTournamentId) {
            this.joinTournament(this.currentTournamentId);  // зайти в комнату
        }
    });

    // Событие: отключились
    this.socket.on('disconnect', () => { });

    // Событие: ошибка подключения
    this.socket.on('connect_error', (error) => {
        this.reconnectAttempts++;
    });
},
```

**`io(url, options)`** — функция из Socket.IO library (подключена в index.html):
```html
<script src="https://cdn.socket.io/socket.io.js"></script>
```
`io()` создаёт WebSocket соединение и возвращает socket объект.

**`socket.on('событие', fn)`** — слушать событие от сервера.
**`socket.emit('событие', data)`** — отправить событие на сервер.

**Как Socket.IO переподключается:**
```
Потеря связи → ждать 1с → попытка 1
Неудача → ждать 2с → попытка 2
Неудача → ждать 4с → попытка 3
...до maxReconnectAttempts
```
Задержка удваивается (exponential backoff), максимум 5с.

**Зачем сохранять currentTournamentId?**
При переподключении нужно снова зайти в ту же комнату.
При обрыве связи информация теряется — сохраняем заранее.

---

## ФУНКЦИЯ: setupEventHandlers() — обработчики событий

```js
setupEventHandlers() {
    this.socket.on('match:score-update', (data) => {
        this.handleScoreUpdate(data);
    });

    this.socket.on('match:event', (data) => {
        this.handleMatchEvent(data);
    });

    this.socket.on('standings:update', (data) => {
        this.handleStandingsUpdate(data);
    });

    this.socket.on('statistics:update', (data) => {
        this.handleStatisticsUpdate(data);
    });
},
```

Это просто подписки на события от сервера.
Каждое имя события (`match:score-update`) должно совпадать с тем что сервер шлёт в socketHandler.js.

**Схема потока данных:**
```
Backend: socket.emit('match:score-update', { matchId, team1Score, team2Score })
                            ↓ через интернет ↓
Frontend: socket.on('match:score-update', data => ...)
```

---

## ФУНКЦИЯ: joinTournament() / leaveTournament()

```js
joinTournament(tournamentId) {
    if (!this.socket || !this.socket.connected) {
        this.currentTournamentId = tournamentId;  // запомним для reconnect
        return;
    }

    // Покинуть предыдущую комнату
    if (this.currentTournamentId && this.currentTournamentId !== tournamentId) {
        this.leaveTournament(this.currentTournamentId);
    }

    this.currentTournamentId = tournamentId;
    this.socket.emit('tournament:join', tournamentId);  // сообщить серверу
},

leaveTournament(tournamentId) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('tournament:leave', tournamentId);
    this.currentTournamentId = null;
},
```

**Концепция комнат (rooms):**
```
Сервер: socket.join('tournament:5')  → пользователь в комнате турнира 5
Сервер: io.to('tournament:5').emit('standings:update', data)
        → уведомление получат ТОЛЬКО те кто в комнате 5
```

Зачем это нужно: если 100 людей смотрят разные турниры — каждый получает обновления ТОЛЬКО своего турнира.

**`this.socket.connected`** — булево свойство, true если соединение активно.

---

## ФУНКЦИЯ: handleScoreUpdate() — обновление счёта

```js
handleScoreUpdate(data) {
    // data = { matchId: 42, team1Score: 2, team2Score: 1, status: 'active' }

    // 1. Найти карточку матча в DOM
    const fixtureCard = document.querySelector(`[data-match-id="${data.matchId}"]`);
    if (fixtureCard) {
        const scoreDisplay = fixtureCard.querySelector('.match-score');
        if (scoreDisplay) {
            scoreDisplay.innerHTML = `
                <span style="color: #2ecc71; font-weight: bold; font-size: 24px;">
                    ${data.team1Score} - ${data.team2Score}
                </span>
            `;
        }
    }

    // 2. Обновить открытый модал матча (если открыт)
    if (Tournaments.currentMatch && Tournaments.currentMatch.id == data.matchId) {
        Tournaments.currentMatch.team1_score = data.team1Score;
        Tournaments.currentMatch.team2_score = data.team2Score;
        Tournaments.updateScoreDisplay();
    }

    // 3. Уведомление пользователю
    UI.showNotification('Match score updated!', 'info', 2000);

    // 4. Кастомное событие для доп. обработки
    window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: data }));
},
```

**`document.querySelector('[data-match-id="42"]')`** — атрибутный селектор с конкретным значением:
```html
<div class="match-card" data-match-id="42">...</div>
```
Так каждая карточка матча помечена своим ID и мы можем мгновенно её найти.

**`Tournaments.currentMatch.id == data.matchId`** — двойное `==` (не тройное `===`).
Почему? `id` из БД может быть числом (42), `matchId` из WebSocket может быть строкой ("42").
`==` сравнивает без учёта типа: `42 == "42"` → true.
`===` сравнивало бы строго: `42 === "42"` → false.

---

## ФУНКЦИЯ: handleMatchEvent() — гол, карточка

```js
handleMatchEvent(data) {
    // data = { matchId: 42, eventType: 'goal', playerName: 'Arman', teamName: 'FC Unity', minute: 67 }

    let message;
    let notificationType = 'info';

    switch (data.eventType) {
        case 'goal':
            message = `Goal! ${data.playerName} (${data.teamName}) 67'`;
            notificationType = 'success';
            break;
        case 'yellow_card':
            message = `Yellow card: ${data.playerName} 67'`;
            break;
        case 'red_card':
            message = `Red card: ${data.playerName} 67'`;
            notificationType = 'error';
            break;
        default:
            message = `${data.eventType}: ${data.playerName} 67'`;
    }

    UI.showNotification(message, notificationType, 3000);

    // Добавить событие в список если модал открыт
    if (Tournaments.currentMatch && Tournaments.currentMatch.id == data.matchId) {
        if (!Tournaments.currentMatch.events) {
            Tournaments.currentMatch.events = [];
        }
        Tournaments.currentMatch.events.push({ ... });
        Tournaments.loadMatchEvents();  // перерисовать список
    }
},
```

**`switch/case`** — множественный выбор:
```js
switch (значение) {
    case 'вариант1':
        // код
        break;  // обязательно! иначе выполнятся следующие case
    case 'вариант2':
        // код
        break;
    default:
        // если ни один case не подошёл
}
```

Лучше `if/else if` когда много вариантов — читаемее.

**`array.push(item)`** — добавить элемент в конец массива:
```js
let events = [];
events.push({ type: 'goal', minute: 67 });
// events = [{ type: 'goal', minute: 67 }]
```

---

## ФУНКЦИЯ: reconnect() / disconnect()

```js
// После входа в систему — переподключиться с токеном
reconnect() {
    if (this.socket) {
        this.socket.auth.token = API.getToken();  // обновить токен
        this.socket.disconnect().connect();        // переподключиться
    }
},

// При выходе из системы
disconnect() {
    if (this.socket) {
        this.socket.disconnect();
    }
    this.currentTournamentId = null;
},
```

**Почему reconnect при логине?**
Первое подключение было анонимным (без токена). После логина нужно переподключиться с JWT токеном чтобы сервер знал кто мы и разрешил войти в закрытые комнаты.

---

## Полная схема работы WebSocket

```
FRONTEND                              BACKEND
─────────                             ───────

1. Пользователь открывает турнир
WebSocketManager.joinTournament(5)
socket.emit('tournament:join', 5)  →  socket.join('tournament:5')

2. Организатор вводит гол
                                      tournamentSocket.emitMatchEvent(...)
                                      io.to('tournament:5').emit('match:event', data)

3. Все в комнате получают событие
socket.on('match:event', data)  ←
handleMatchEvent(data)
UI.showNotification('Goal! Arman 67\'')
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `io(url, options)` | Создать Socket.IO соединение |
| `socket.on('event', fn)` | Слушать событие от сервера |
| `socket.emit('event', data)` | Отправить событие на сервер |
| `socket.connected` | Булево: соединение активно? |
| `switch/case/break/default` | Множественный выбор |
| `array.push(item)` | Добавить элемент в конец массива |
| `== vs ===` | `==` без учёта типа, `===` строгое |
| `[data-attr="value"]` | Атрибутный CSS селектор с конкретным значением |
| Exponential backoff | Удваивание задержки при reconnect |
| Socket.IO rooms | Комнаты — рассылка только подписчикам |

---

## ❓ Вопросы с защиты

**Q: Что такое WebSocket и зачем он нужен?**
A: WebSocket — постоянное двустороннее соединение между браузером и сервером. Обычный HTTP — клиент спрашивает, сервер отвечает, соединение закрывается. WebSocket держит соединение открытым — сервер может сам отправить данные в любой момент. Нужен для реального времени: счёт матча обновляется у всех зрителей мгновенно без перезагрузки страницы.

**Q: Зачем комнаты (rooms) в Socket.IO?**
A: Если 100 человек смотрят разные турниры, не нужно слать обновления всем. Комнаты позволяют отправлять события только нужной группе. io.to('tournament:5').emit(...) — получат только те кто в комнате 5.

**Q: Почему == а не === при сравнении matchId?**
A: id из базы данных — число (42), matchId из WebSocket — может быть строкой ("42"). == сравнивает без учёта типа: 42 == "42" → true. === дало бы false и мы не нашли бы матч.

**Q: Что делает reconnect() и когда вызывается?**
A: При первом подключении пользователь не авторизован — socket без токена. После логина вызывается reconnect() — обновляем token в socket.auth и переподключаемся. Теперь сервер знает кто мы.

**Q: Что происходит при обрыве соединения?**
A: Socket.IO автоматически пробует переподключиться. Задержка растёт: 1с, 2с, 4с... до 5с максимум. Максимум 5 попыток. При успешном переподключении событие 'connect' срабатывает снова и мы заново входим в комнату турнира (currentTournamentId).
