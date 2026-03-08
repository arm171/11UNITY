# 📁 Файлы: backend/routes/auth.js + backend/controllers/authController.js

---

# ЧАСТЬ 1: routes/auth.js

## Что это такое?
Роут — это "адрес" в нашем API. Файл routes/auth.js описывает какие адреса существуют
для авторизации и какой контроллер обрабатывает каждый.

## Весь файл:
```js
const express = require('express');
const router = express.Router();  // создаём мини-роутер
const authController = require('../controllers/authController');

router.post('/register', authController.register);  // POST /api/auth/register
router.post('/login', authController.login);         // POST /api/auth/login

module.exports = router;
```

**Как получается полный адрес?**
В server.js написано: `app.use('/api/auth', authRoutes)`
Здесь написано: `router.post('/register', ...)`
Итого: POST /api/auth/register

**Разделение roles и controllers — зачем?**
Роут — только адрес и метод (GET/POST/PUT/DELETE).
Контроллер — логика что делать.
Это называется разделение ответственности (separation of concerns).

---

# ЧАСТЬ 2: controllers/authController.js

## Что это такое?
Контроллер содержит логику — что делать когда пришёл запрос.
authController отвечает за регистрацию и вход пользователей.

---

## ФУНКЦИЯ 1: register — регистрация

### Полный процесс регистрации (7 шагов):

**Шаг 1 — Получить данные из запроса:**
```js
const { name, email, password, role } = req.body;
```
- `req.body` — тело запроса (JSON который прислал frontend)
- Деструктуризация: вытаскиваем нужные поля из объекта
- Пример req.body: `{ name: "Arman", email: "a@a.com", password: "123456", role: "coach" }`

**Шаг 2 — Валидация (проверка данных):**
```js
if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
}
```
- `!name` — если name пустой, null, undefined или "" → true
- Проверяем что все поля заполнены
- Возвращаем 400 (Bad Request) с объяснением

```js
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) { ... }
```
- `emailRegex` — регулярное выражение для проверки email формата
- `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — шаблон: "что-то @ что-то . что-то"
- `.test(email)` — проверить соответствует ли email этому шаблону

**Шаг 3 — Проверить не занят ли email:**
```js
const [existingUsers] = await db.promise().query(
    'SELECT id FROM users WHERE email = ?',
    [email]
);

if (existingUsers.length > 0) {
    return res.status(409).json({ message: 'User already exists' });
}
```
- `db.promise().query()` — выполнить SQL запрос (асинхронно, через Promise)
- `await` — подождать результата (не продолжать пока не получим ответ от БД)
- `?` в SQL — placeholder, защита от SQL инъекций (вместо ? подставится email)
- `[existingUsers]` — деструктуризация, query возвращает [rows, fields], нам нужны rows
- 409 = Conflict (конфликт — такой email уже есть)

**Шаг 4 — Хешировать пароль:**
```js
const hashedPassword = await bcrypt.hash(password, 10);
```
- НИКОГДА нельзя хранить пароль в открытом виде!
- `bcrypt.hash(password, 10)` — создаёт хеш пароля
- `10` — "cost factor" (сложность). Чем больше — тем надёжнее, но медленнее
- Хеш всегда разный даже для одного пароля: `$2a$10$abc...`

**Шаг 5 — Создать пользователя в БД:**
```js
const [result] = await db.promise().query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, role]
);
const userId = result.insertId;  // ID только что созданного пользователя
```
- `INSERT INTO` — добавить строку в таблицу
- `result.insertId` — MySQL возвращает ID новой записи

**Шаг 6 — Создать JWT токен:**
```js
const token = jwt.sign(
    { id: userId, email, role },  // данные которые кладём в токен
    process.env.JWT_SECRET,        // секретный ключ для подписи
    { expiresIn: '30d' }           // токен действует 30 дней
);
```
- `jwt.sign()` — создать токен
- В токен кладём: id, email, role — это то что сервер будет знать о пользователе
- JWT_SECRET — секрет, только сервер знает. Нужен чтобы никто не мог подделать токен

**Шаг 7 — Отправить ответ:**
```js
res.status(201).json({
    success: true,
    token,         // сокращённая запись: token: token
    user: { id: userId, name, email, role }
});
```
- 201 = Created (создано)
- Возвращаем токен и данные пользователя — frontend сохранит их

---

## ФУНКЦИЯ 2: login — вход

### Процесс входа (5 шагов):

**Шаг 1 — Получить email и пароль:**
```js
const { email, password } = req.body;
```

**Шаг 2 — Найти пользователя по email:**
```js
const [users] = await db.promise().query(
    'SELECT * FROM users WHERE email = ?',
    [email]
);
if (users.length === 0) {
    return res.status(401).json({ message: 'Invalid email or password' });
}
const user = users[0];  // берём первого (и единственного, email уникальный)
```

**Шаг 3 — Проверить пароль:**
```js
const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
}
```
- `bcrypt.compare(введённый пароль, хеш из БД)` → true или false
- Важно: возвращаем одинаковое сообщение и для неверного email и для неверного пароля!
  Это специально — чтобы злоумышленник не знал что именно неверно.

**Шаг 4 — Создать JWT токен** (точно так же как при регистрации)

**Шаг 5 — Отправить ответ с токеном и данными пользователя**

---

## 🔑 Что такое async/await?

Это очень важная JS концепция!

**Проблема:** Запрос к БД занимает время (несколько миллисекунд).
Если не ждать — код продолжит выполняться и попробует использовать данные которых ещё нет.

**Без async/await (плохо — callback hell):**
```js
db.query('SELECT...', function(err, result) {
    db.query('INSERT...', function(err, result2) {
        db.query('SELECT...', function(err, result3) {
            // код уходит вправо до бесконечности
        });
    });
});
```

**С async/await (хорошо — читаемо):**
```js
const register = async (req, res) => {  // async = эта функция асинхронная
    const [users] = await db.query(...);  // await = жди результата
    const hash = await bcrypt.hash(...);  // жди хеша
    const [result] = await db.query(...); // жди вставки
    // код читается сверху вниз, как синхронный!
};
```

- `async` перед функцией = она возвращает Promise
- `await` перед вызовом = подожди пока Promise выполнится
- `await` можно использовать только внутри `async` функции

---

## 📊 Схема регистрации

```
Frontend отправляет: POST /api/auth/register
{ name, email, password, role }
         ↓
routes/auth.js → authController.register
         ↓
1. Валидация полей
2. Проверка email формата
3. Проверка длины пароля
4. Проверка роли
5. SELECT — занят ли email? → если да: 409
6. bcrypt.hash(password) — хешируем пароль
7. INSERT INTO users — создаём пользователя
8. jwt.sign() — создаём токен
9. Возвращаем: { success, token, user }
         ↓
Frontend получает токен и сохраняет в localStorage
```

---

## 🔑 JS Концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `async/await` | Асинхронный код который читается как синхронный |
| `await` | Подождать выполнения асинхронной операции |
| `req.body` | Тело запроса (JSON от клиента) |
| Деструктуризация `{ a, b } = obj` | Вытащить поля из объекта |
| `!value` | Отрицание — true если value пустой/null/undefined |
| `array.length` | Количество элементов в массиве |
| Регулярные выражения `/паттерн/` | Шаблон для проверки строк |
| `regex.test(string)` | Проверить соответствует ли строка шаблону |
| Shorthand `{ token }` | Сокращение для `{ token: token }` |

---

## ❓ Вопросы с защиты

**Q: Почему пароль нельзя хранить в открытом виде?**
A: Если БД взломают — злоумышленник получит все пароли. Хеш нельзя "расшифровать" обратно — можно только сравнить. bcrypt специально медленный чтобы перебор был невозможен.

**Q: Что такое SQL инъекция и как мы защищаемся?**
A: Атака когда в поле вводят SQL код: `email = "'; DROP TABLE users; --"`. Знак `?` (placeholder) экранирует данные — они воспринимаются как строка, не как код.

**Q: Почему при неверном пароле и неверном email возвращается одинаковое сообщение?**
A: Чтобы злоумышленник не мог узнать существует ли такой email в системе. Если бы писали "email не найден" — можно было бы перебирать emails.

**Q: Зачем кладём id и role в JWT токен?**
A: Чтобы при каждом запросе знать кто это и какая у него роль — без лишнего запроса к БД.

**Q: Что такое async/await?**
A: Синтаксический сахар над Promises. Позволяет писать асинхронный код (запросы к БД, файлам) так же читаемо как синхронный. async перед функцией — она асинхронная. await — подождать результата.

**Q: Зачем роуты отдельно от контроллеров?**
A: Разделение ответственности. Роут знает только адрес и метод. Контроллер знает только логику. Если нужно изменить URL — меняем только роут. Если нужно изменить логику — только контроллер.
