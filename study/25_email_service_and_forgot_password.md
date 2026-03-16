# 📧 Email сервис и восстановление пароля
## Файлы: backend/services/emailService.js, backend/controllers/authController.js

---

## Что мы реализовали

1. **Подтверждение email при регистрации** — пользователь получает письмо со ссылкой
2. **Восстановление пароля** — пользователь получает письмо со ссылкой для сброса

---

## Как работает отправка email

### Технология: Nodemailer + Gmail SMTP

```
Наш сервер → SMTP Gmail (smtp.gmail.com:587) → Email ящик пользователя
```

**SMTP** = Simple Mail Transfer Protocol — протокол для отправки почты.
**Gmail SMTP** = Gmail позволяет использовать свой сервер для отправки писем через наши приложения.

### Конфиг в .env:
```
EMAIL_USER=наш_gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   ← Google App Password (не обычный пароль!)
```

**App Password** — специальный пароль для приложений. Создаётся в настройках Google аккаунта → Безопасность → Пароли приложений.

### emailService.js:
```js
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,          // TLS (не SSL)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```
`transporter` — это "почтальон" который знает как отправлять письма.

---

## Регистрация: подтверждение email

### Полный поток:

```
1. Пользователь регистрируется
2. authController.register():
   - хешируется пароль (bcrypt)
   - генерируется токен: crypto.randomBytes(32).toString('hex')
   - пользователь сохраняется в БД со статусом is_verified = false
   - вызывается sendVerificationEmail()
3. emailService.sendVerificationEmail():
   - формирует ссылку: http://...?token=ABC123
   - отправляет HTML письмо через Gmail SMTP
4. Пользователь кликает ссылку в письме
5. Браузер открывает: http://127.0.0.1:5500/frontend/index.html?token=ABC123
6. auth.js видит ?token= в URL → вызывает GET /api/auth/verify/ABC123
7. authController.verifyEmail():
   - ищет пользователя с этим токеном
   - UPDATE users SET is_verified = true, verification_token = NULL
   - перенаправляет на сайт с сообщением об успехе
```

---

## Восстановление пароля: forgot password

### Зачем?
Пользователь забыл пароль → не может войти → нужен способ сброса.
Нельзя отправить текущий пароль (он хешированный, нельзя расшифровать).
Решение: временная ссылка для создания нового пароля.

### Полный поток:

**Шаг 1: Запрос сброса**
```
Пользователь нажимает "Forgot password?" на форме входа
         │
         ▼
auth.js:
  - если уже ввёл email в поле входа — берёт его оттуда
  - иначе показывает мини-форму для ввода email
  - вызывает: API.request('/auth/forgot-password', 'POST', { email })
         │
         ▼
authController.forgotPassword():
  1. Ищет пользователя по email
  2. Если не найден → всё равно отвечает "успешно" (безопасность: не раскрываем что email не зарегистрирован)
  3. Генерирует токен: crypto.randomBytes(32).toString('hex')
  4. Сохраняет: UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
  5. Отправляет email: sendPasswordResetEmail(email, name, token)
         │
         ▼
Пользователь видит уведомление (красивая карточка):
  "Ссылка отправлена на example@gmail.com"
  [Открыть почту] ← кнопка открывает Gmail
```

**Шаг 2: Пользователь кликает ссылку в письме**
```
Email ссылка: http://127.0.0.1:5500/frontend/index.html?reset_token=ABC123
         │
         ▼
Браузер открывает сайт с ?reset_token= в URL
auth.js (handleVerificationRedirect):
  - видит reset_token в URL
  - убирает токен из URL (replaceState)
  - открывает модальное окно "Enter New Password"
```

**Шаг 3: Новый пароль**
```
Пользователь вводит новый пароль → Submit
         │
         ▼
API.request('/auth/reset-password', 'POST', { token, newPassword })
         │
         ▼
authController.resetPassword():
  1. Ищет пользователя: SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()
  2. Если не найден или срок истёк → ошибка
  3. Хеширует новый пароль: bcrypt.hash(newPassword, 10)
  4. Сохраняет: UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL
  5. Отвечает: { success: true }
         │
         ▼
auth.js:
  - закрывает модалку
  - показывает toast "Password changed! Please login"
  - открывает форму входа
```

---

## Миграция БД

Поля `reset_token` и `reset_token_expires` добавили позже (не было в schema.sql).
Для этого использовали **миграционный скрипт**:

```js
// backend/scripts/migrate_add_password_reset.js
await db.execute(`
    ALTER TABLE users
    ADD COLUMN reset_token VARCHAR(64) NULL,
    ADD COLUMN reset_token_expires DATETIME NULL
`);
```
**Миграция** — изменение структуры уже существующей БД без потери данных.

---

## Безопасность

| Угроза | Защита |
|--------|--------|
| Брутфорс сброса пароля | Rate limiter: 5 запросов за 15 минут |
| Кража токена | Токен одноразовый, истекает через 1 час |
| Перебор токенов | `crypto.randomBytes(32)` = 256 бит случайности |
| Раскрытие зарегистрированных email | При неверном email тот же ответ "успешно" |
| Переиспользование токена | После смены пароля: reset_token = NULL |

---

## Важные концепции

### Почему нельзя отправить текущий пароль?
Пароль хранится как bcrypt хеш. Хеш — это **одностороннее** преобразование.
`"mypassword"` → `"$2b$10$N9qo8uLOickgx2ZMRZo..."` — обратно не конвертировать.
Поэтому единственный вариант — создать новый пароль.

### Почему токен в URL а не в теле запроса?
Email клиент не может отправить POST запрос. Только открыть ссылку (GET).
Поэтому токен передаётся как URL параметр `?reset_token=ABC`.
Frontend читает его из `window.location.search` и дальше работает через POST API.

### Зачем срок действия токена (1 час)?
Безопасность. Если письмо попало к злоумышленнику (утечка почты) — через час ссылка не работает.
В БД хранится дата истечения: `reset_token_expires DATETIME`.
При использовании проверяем: `reset_token_expires > NOW()`.

---

## Вопросы с защиты

**Q: Как реализовано восстановление пароля?**
A: Пользователь вводит email → сервер генерирует криптографически случайный токен (crypto.randomBytes) → сохраняет токен с датой истечения (1 час) в БД → отправляет email со ссылкой → пользователь кликает → frontend показывает форму нового пароля → отправляем токен + новый пароль на сервер → сервер проверяет токен, хеширует новый пароль, сохраняет, обнуляет токен.

**Q: Почему не хранить токен сброса в отдельной таблице?**
A: Для простоты. Поскольку у каждого пользователя может быть максимум один активный запрос сброса — одно поле в таблице users достаточно. Отдельная таблица нужна если хотим хранить историю сбросов.

**Q: Как защититься от перебора токенов?**
A: 1) crypto.randomBytes(32) = 32 байта = 10^77 вариантов. 2) Rate limiter (5 запросов / 15 мин). 3) Токен действует только 1 час.
