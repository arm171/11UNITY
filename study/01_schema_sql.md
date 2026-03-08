# 📁 Файл: backend/schema.sql
## Что это такое?
Это файл структуры базы данных. Он описывает все таблицы, поля и связи.
SQL (Structured Query Language) — язык для работы с базами данных.
Этот файл запускается один раз при создании проекта — он создаёт все таблицы в MySQL.

---

## 🗄️ Что такое База Данных?
База данных — это место где хранятся все данные сайта (пользователи, команды, турниры и т.д.)
MySQL — конкретная программа для хранения данных. Данные хранятся в таблицах (как Excel).

---

## 📋 Таблицы в нашей базе данных

### 1. users — Пользователи
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- уникальный номер каждого пользователя
    name VARCHAR(100) NOT NULL,         -- имя (максимум 100 символов, обязательное)
    email VARCHAR(255) NOT NULL UNIQUE, -- email (уникальный - нельзя два одинаковых)
    password VARCHAR(255) NOT NULL,     -- пароль (хранится зашифрованным!)
    role ENUM('player', 'coach', 'organizer') NOT NULL, -- роль пользователя
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- дата регистрации
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- дата обновления
)
```
**Зачем:** Хранит всех пользователей сайта. Один пользователь может быть игроком, тренером или организатором.
**ENUM** — означает что значение может быть ТОЛЬКО одним из списка (player, coach, или organizer — других вариантов нет).

---

### 2. tournaments — Турниры
```sql
CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,         -- название турнира
    type ENUM('league', 'playoff', 'group_playoff') NOT NULL, -- тип турнира
    category ENUM('school', 'university', 'amateur') NOT NULL, -- категория
    start_date DATE NOT NULL,           -- дата начала
    location VARCHAR(255),              -- место проведения
    description TEXT,                   -- описание (длинный текст)
    max_teams INT NOT NULL DEFAULT 8,   -- максимум команд (по умолчанию 8)
    min_players_per_team INT NOT NULL DEFAULT 11, -- минимум игроков в команде
    status ENUM('upcoming', 'active', 'finished') DEFAULT 'upcoming', -- статус
    organizer_id INT NOT NULL,          -- кто создал турнир (ссылка на users.id)

    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
)
```
**Зачем:** Хранит все турниры. `organizer_id` — это связь с таблицей users (кто из пользователей создал этот турнир).
**DEFAULT** — значение по умолчанию если не указано другое.
**ON DELETE CASCADE** — если удалить пользователя, все его турниры тоже удалятся автоматически.

---

### 3. teams — Команды
```sql
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,         -- название команды
    logo VARCHAR(10),                   -- аббревиатура (2-3 буквы, например "FCB")
    logo_color VARCHAR(7) DEFAULT '#2ecc71', -- цвет логотипа (hex код, например #ff0000)
    description TEXT,                   -- описание команды
    max_players INT NOT NULL DEFAULT 25, -- максимум 25 игроков
    coach_id INT NOT NULL,              -- тренер команды

    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_coach_team (coach_id) -- один тренер = одна команда
)
```
**Зачем:** Хранит все команды. Каждая команда принадлежит одному тренеру.
**UNIQUE KEY** — гарантирует что одно значение не повторится. Тренер не может создать 2 команды.

---

### 4. team_players — Игроки в командах (связующая таблица)
```sql
CREATE TABLE team_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,    -- ссылка на команду
    player_id INT NOT NULL,  -- ссылка на игрока (пользователь с ролью player)
    position ENUM('goalkeeper', 'defender', 'midfielder', 'forward'), -- позиция
    jersey_number INT,       -- номер майки

    UNIQUE KEY unique_player (player_id) -- игрок может быть только в одной команде
)
```
**Зачем:** Это связь между командами и игроками. Это называется Many-to-Many (много-ко-многим).
Одна команда — много игроков. Один игрок — только одна команда.

---

### 5. tournament_teams — Команды в турнирах (связующая таблица)
```sql
CREATE TABLE tournament_teams (
    tournament_id INT NOT NULL, -- ссылка на турнир
    team_id INT NOT NULL,       -- ссылка на команду

    UNIQUE KEY unique_tournament_team (tournament_id, team_id) -- команда не может войти дважды
)
```
**Зачем:** Связь между турнирами и командами. Один турнир — много команд. Одна команда — много турниров.

---

### 6. matches — Матчи
```sql
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,  -- в каком турнире
    team1_id INT NOT NULL,       -- первая команда
    team2_id INT NOT NULL,       -- вторая команда
    match_date DATETIME,         -- дата и время матча
    round VARCHAR(50),           -- раунд ("Round 1", "Semi Final", "Final")
    team1_score INT DEFAULT 0,   -- счёт первой команды
    team2_score INT DEFAULT 0,   -- счёт второй команды
    status ENUM('scheduled', 'in_progress', 'finished', 'cancelled') DEFAULT 'scheduled'
)
```
**Зачем:** Хранит все матчи. Каждый матч — это два team_id и счёт.

---

### 7. match_events — События матча
```sql
CREATE TABLE match_events (
    match_id INT NOT NULL,    -- в каком матче
    team_id INT NOT NULL,     -- какой команды событие
    player_id INT NOT NULL,   -- какой игрок
    event_type ENUM('goal', 'yellow_card', 'red_card', 'substitution'), -- тип события
    minute INT,               -- на какой минуте
    is_own_goal BOOLEAN DEFAULT FALSE,  -- автогол?
    assist_player_id INT NULL  -- кто сделал пас (для гола)
)
```
**Зачем:** Каждый гол, карточка, замена — записывается сюда. Так система знает кто забил и когда.

---

### 8. standings — Турнирная таблица
```sql
CREATE TABLE standings (
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    played INT DEFAULT 0,          -- сыграно матчей
    won INT DEFAULT 0,             -- побед
    drawn INT DEFAULT 0,           -- ничьих
    lost INT DEFAULT 0,            -- поражений
    goals_for INT DEFAULT 0,       -- голов забито
    goals_against INT DEFAULT 0,   -- голов пропущено
    goal_difference INT DEFAULT 0, -- разница голов
    points INT DEFAULT 0           -- очки (победа=3, ничья=1, поражение=0)
)
```
**Зачем:** Хранит турнирную таблицу лиги. Автоматически обновляется после каждого матча.

---

### 9. player_statistics — Статистика игроков
```sql
CREATE TABLE player_statistics (
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    goals INT DEFAULT 0,         -- голов забито
    assists INT DEFAULT 0,       -- голевых передач
    yellow_cards INT DEFAULT 0,  -- жёлтых карточек
    red_cards INT DEFAULT 0,     -- красных карточек
    matches_played INT DEFAULT 0 -- матчей сыграно
)
```
**Зачем:** Статистика каждого игрока в каждом турнире. Используется для рейтингов бомбардиров.

---

## 🔗 Как таблицы связаны между собой (схема)

```
users
  ├── tournaments (organizer_id → users.id)
  ├── teams (coach_id → users.id)
  ├── team_players (player_id → users.id)
  └── match_events (player_id → users.id)

tournaments
  ├── tournament_teams (tournament_id → tournaments.id)
  ├── matches (tournament_id → tournaments.id)
  ├── standings (tournament_id → tournaments.id)
  └── player_statistics (tournament_id → tournaments.id)

teams
  ├── team_players (team_id → teams.id)
  ├── tournament_teams (team_id → teams.id)
  ├── matches (team1_id, team2_id → teams.id)
  └── standings (team_id → teams.id)
```

---

## 🔑 Важные понятия SQL

| Понятие | Объяснение |
|---------|------------|
| `PRIMARY KEY` | Уникальный ID каждой строки. Не может повторяться. |
| `AUTO_INCREMENT` | Автоматически увеличивается: 1, 2, 3, 4... |
| `NOT NULL` | Поле обязательное — нельзя оставить пустым |
| `UNIQUE` | Значение не может повторяться в таблице |
| `DEFAULT` | Значение по умолчанию если не указано |
| `FOREIGN KEY` | Ссылка на другую таблицу (связь между таблицами) |
| `ON DELETE CASCADE` | При удалении родителя — удаляются и дети |
| `INDEX` | Ускоряет поиск по этому полю |
| `ENUM` | Поле может содержать только одно из перечисленных значений |
| `VARCHAR(N)` | Текст до N символов |
| `TEXT` | Длинный текст без ограничения |
| `INT` | Целое число |
| `BOOLEAN` | true или false |
| `TIMESTAMP` | Дата и время |

---

## ❓ Вопросы которые могут задать на защите

**Q: Почему пароль хранится в VARCHAR(255) а не как обычный текст?**
A: Пароль хранится в зашифрованном виде (bcrypt hash). Хеш всегда длиной ~60 символов. VARCHAR(255) с запасом.

**Q: Что такое FOREIGN KEY и зачем он нужен?**
A: Это связь между таблицами. Гарантирует что нельзя создать матч с несуществующей командой. База сама проверяет целостность данных.

**Q: Почему у team_players есть UNIQUE KEY unique_player (player_id)?**
A: Чтобы один игрок не мог быть в двух командах одновременно. Это бизнес-логика на уровне базы данных.

**Q: Что такое ON DELETE CASCADE?**
A: Если удалить турнир — все матчи, команды и статистика этого турнира удалятся автоматически. Не будет "висячих" данных.

**Q: Зачем нужна отдельная таблица standings если можно вычислять из matches?**
A: Для скорости. Вычислять каждый раз из сотен матчей — медленно. Standings обновляется после каждого матча и всегда готово к быстрому чтению.

**Q: Что такое ENGINE=InnoDB?**
A: Движок MySQL который поддерживает FOREIGN KEY и транзакции. MyISAM (старый движок) не поддерживает.

**Q: Что такое utf8mb4?**
A: Кодировка символов. Поддерживает все языки включая армянский, грузинский, эмодзи. Обычный utf8 в MySQL не поддерживает 4-байтные символы.

**Q: Зачем INDEX на разных полях?**
A: INDEX ускоряет поиск. Например INDEX idx_status позволяет быстро найти все турниры со статусом 'active' без перебора всех строк.
