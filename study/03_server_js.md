# 📁 Файл: backend/server.js
## Что это такое?
Это ГЛАВНЫЙ файл всего backend'а. Именно его запускают командой `node server.js`.
Он запускает сервер, подключает все части проекта и начинает слушать запросы от frontend'а.

Если проект — это здание, то server.js — это главный вход, охрана и reception.

---

## Разбор кода блок за блоком

---

### БЛОК 1: Подключение библиотек (строки 6-9)
```js
require('dotenv').config();        // загружает .env файл в process.env
const express = require('express'); // веб-фреймворк для создания сервера
const cors = require('cors');       // разрешает запросы с другого домена/порта
const http = require('http');       // встроенный Node.js модуль для HTTP сервера
```

**Express** — это библиотека которая упрощает создание веб-сервера.
Без Express нужно было бы писать 100 строк кода. С Express — 5 строк.

**CORS** (Cross-Origin Resource Sharing) — браузер по умолчанию блокирует запросы
с одного адреса на другой. У нас frontend на порту 5500 (Live Server), backend на 3000.
Это разные порты = разные "origin". CORS разрешает это.

**dotenv** — библиотека которая читает .env файл и кладёт всё в process.env.

---

### БЛОК 2: Создание приложения (строки 11-16)
```js
const app = express();              // создаём Express приложение
const server = http.createServer(app); // оборачиваем в HTTP сервер

const { initSocket } = require('./socket/socketHandler'); // подключаем Socket.IO
initSocket(server);                 // инициализируем WebSocket на том же сервере
```

**Зачем два объекта — app и server?**
- `app` — это Express (обрабатывает HTTP запросы)
- `server` — это HTTP сервер (нужен для Socket.IO)
- Socket.IO требует именно HTTP сервер, не Express напрямую
- Оба работают на одном порту 3000

---

### БЛОК 3: Middleware (строки 22-34)

**Что такое Middleware?**
Middleware = "промежуточное ПО". Это функции которые выполняются на КАЖДЫЙ запрос,
ДО того как запрос попадёт к нужному роуту.

Представь конвейер на заводе:
```
Запрос → [CORS] → [JSON парсер] → [Логгер] → [Роут] → Ответ
```
Каждый [] — это middleware.

```js
app.use(cors());                              // на каждый запрос — разрешить CORS
app.use(express.json());                      // на каждый запрос — распарсить JSON тело
app.use(express.urlencoded({ extended: true })); // распарсить form data
```

**Логгер middleware:**
```js
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);  // выводит: "GET /api/teams"
    next();  // передать запрос дальше по конвейеру
});
```
- `req` — request (запрос от клиента)
- `res` — response (ответ который отправим)
- `next` — функция "иди дальше"
- Если не вызвать `next()` — запрос зависнет и ответа не будет!

---

### БЛОК 4: Подключение к БД (строки 40-50)
```js
const db = require('./config/database'); // берём наш пул из database.js

db.getConnection((err, connection) => {  // пробуем получить подключение
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);  // если БД недоступна — СТОП, сервер не нужен
    }
    console.log('Database connected successfully');
    connection.release(); // возвращаем подключение обратно в пул
});
```
- Это проверка при старте: "БД работает? Нет? Тогда выключаемся."
- `process.exit(1)` — завершить процесс с кодом ошибки (1 = ошибка)
- `connection.release()` — важно! Если не освободить — подключение "потеряется"

---

### БЛОК 5: Роуты (строки 56-68)
```js
const authRoutes = require('./routes/auth');
// ... и т.д.

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/profile', profileRoutes);
```

Это "подключение" роутов. Каждый файл в routes/ отвечает за свою часть API.

**Как это работает:**
```
GET /api/teams/5
        ↓
app.use('/api/teams', teamRoutes)  ← сервер видит что начинается с /api/teams
        ↓
teamRoutes обрабатывает /5         ← и передаёт остаток пути туда
```

---

### БЛОК 6: Обработчики ошибок (строки 88-105)

**404 — Страница не найдена:**
```js
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});
```
Если ни один роут не совпал — возвращаем 404.

**500 — Ошибка сервера:**
```js
app.use((err, req, res, next) => {
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});
```
4 параметра вместо 3 — это специальный обработчик ошибок в Express.
Если где-то в коде выбросилась ошибка — она сюда попадёт.

---

### БЛОК 7: Запуск сервера (строки 110-119)
```js
server.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});
```
- `server.listen(PORT, callback)` — начать слушать порт 3000
- callback (функция) выполнится когда сервер успешно запустился
- `` `текст ${переменная}` `` — это template literal (шаблонная строка) в JS

---

### БЛОК 8: Graceful Shutdown (строки 124-132)
```js
process.on('SIGTERM', () => {
    server.close(() => {
        db.end(() => {
            process.exit(0);
        });
    });
});
```
SIGTERM — сигнал "выключись" от операционной системы.
Вместо резкого отключения: сначала закрываем сервер → потом закрываем БД → потом выходим.
Так не теряются данные в процессе обработки.

---

## 🔑 JS Концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `require()` | Подключить модуль |
| `const x = require('y')` | Импорт библиотеки |
| `app.use()` | Добавить middleware или роут |
| `(req, res, next) => {}` | Функция middleware |
| `next()` | Передать управление следующему middleware |
| `res.status(404).json({})` | Отправить ответ с кодом и JSON |
| `` `текст ${var}` `` | Template literal — вставка переменной в строку |
| `process.exit(1)` | Завершить программу |

---

## 🌐 HTTP коды ответов (важно знать!)

| Код | Значение |
|-----|----------|
| 200 | OK — всё хорошо |
| 201 | Created — создано успешно |
| 400 | Bad Request — неправильный запрос |
| 401 | Unauthorized — не авторизован |
| 403 | Forbidden — нет прав |
| 404 | Not Found — не найдено |
| 500 | Internal Server Error — ошибка сервера |

---

## 📊 Схема работы server.js

```
node server.js
      ↓
1. Загружает .env
2. Создаёт Express app
3. Создаёт HTTP сервер
4. Подключает Socket.IO
5. Добавляет middleware (CORS, JSON, логгер)
6. Проверяет подключение к БД
7. Подключает все роуты
8. Начинает слушать порт 3000
      ↓
Сервер готов принимать запросы!
```

---

## ❓ Вопросы с защиты

**Q: Зачем нужен Express?**
A: Express упрощает создание HTTP сервера. Без него нужно вручную парсить URL, методы, заголовки. Express берёт это на себя.

**Q: Что такое middleware?**
A: Функции которые выполняются на каждый запрос до обработки роута. Используем для: парсинга JSON, проверки авторизации, логирования.

**Q: Зачем CORS?**
A: Браузер блокирует запросы между разными портами/доменами. Наш frontend на порту 5500, backend на 3000 — разные порты. CORS разрешает это.

**Q: Почему сначала app = express(), потом server = http.createServer(app)?**
A: Socket.IO работает на уровне HTTP сервера, не Express. Поэтому нужен отдельный http.createServer. Оба работают на одном порту.

**Q: Что происходит если не вызвать next() в middleware?**
A: Запрос "зависнет" — клиент будет бесконечно ждать ответа. Всегда нужно либо вызвать next(), либо отправить ответ через res.

**Q: Что такое process.exit(1)?**
A: Завершить Node.js процесс. 0 = нормальное завершение, 1 = завершение с ошибкой. Используем если БД недоступна при старте.
