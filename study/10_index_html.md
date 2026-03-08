# 📁 Файл: frontend/index.html

## Что это такое?
Это ЕДИНСТВЕННЫЙ HTML файл всего сайта. Весь сайт — одна страница!
Это называется **SPA (Single Page Application)** — одностраничное приложение.

Нет отдельных файлов tournaments.html, teams.html, matches.html.
Всё в одном файле. Переключение между разделами — JavaScript меняет что видно, а что скрыто.

---

## Структура HTML документа

```
<!DOCTYPE html>          ← тип документа (HTML5)
<html lang="en">         ← корневой элемент, язык по умолчанию
  <head>                 ← метаданные (не видны на странице)
  <body>                 ← всё что видно на странице
```

---

## HEAD — что загружаем

```html
<meta charset="UTF-8">         ← кодировка (поддержка всех языков)
<meta name="viewport" ...>     ← для мобильных устройств (адаптивность)
<title>11UNITY - ...</title>   ← название во вкладке браузера
```

**Шрифты (Google Fonts):**
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto...">
```
Загружаем шрифт Roboto с Google серверов.

**Иконки (Font Awesome):**
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/.../font-awesome...">
```
Font Awesome — библиотека иконок. Используем так: `<i class="fas fa-trophy"></i>`
`fas` = Font Awesome Solid (сплошные иконки).

**Наши CSS файлы (в порядке загрузки):**
```html
<link rel="stylesheet" href="./css/reset.css">      ← сброс стилей браузера
<link rel="stylesheet" href="./css/variables.css">  ← CSS переменные (цвета, размеры)
<link rel="stylesheet" href="./css/components.css"> ← компоненты (кнопки, карточки)
<link rel="stylesheet" href="./css/main.css">       ← основные стили страниц
```
Порядок важен! Каждый файл может переопределить стили предыдущего.

---

## BODY — структура страницы

### 1. HEADER — шапка сайта
```html
<header class="header">
    <nav class="nav">
        <div class="logo">...</div>           ← логотип
        <ul class="nav-list">                  ← навигация
            <li><a href="#home">Home</a></li>
            <li><a href="#tournaments">Tournaments</a></li>
            ...
        </ul>
        <div class="nav-actions">             ← кнопки справа
            <!-- язык + вход -->
        </div>
    </nav>
</header>
```

**`href="#home"`** — якорная ссылка. Прокручивает к элементу с `id="home"`.
Но у нас это перехватывает JavaScript и показывает/скрывает секции.

**`data-i18n="nav.home"`** — атрибут для перевода. i18n.js находит все элементы с этим атрибутом и меняет текст на нужный язык.

---

### 2. LANGUAGE SWITCHER — переключатель языка
```html
<div class="language-switcher" id="language-switcher">
    <button class="lang-btn" id="lang-btn">
        <i class="fas fa-globe"></i>          ← иконка глобуса
    </button>
    <div class="lang-dropdown" id="lang-dropdown">
        <button data-lang="en">English</button>
        <button data-lang="ru">Русский</button>
        <button data-lang="hy">Հայερен</button>
        <button data-lang="ge">ქართული</button>
    </div>
</div>
```
`data-lang="en"` — кастомный атрибут. JavaScript читает его: `button.dataset.lang` → "en".

---

### 3. HERO vs PROFILE SECTION — умная главная страница
```html
<!-- Для гостей (не вошедших) -->
<div class="hero" id="hero-section">
    <h1>Welcome to 11UNITY</h1>
    <button id="hero-cta">Get Started</button>
</div>

<!-- Для авторизованных (скрыт по умолчанию) -->
<div class="profile-dashboard" id="profile-section" style="display: none;">
    <div class="profile-avatar">...</div>
    <h2 id="profile-user-name"></h2>    ← заполняется JS
    <span id="profile-user-role"></span> ← заполняется JS
</div>
```

`style="display: none;"` — скрыть элемент. Когда пользователь входит — JS меняет:
```js
document.getElementById('hero-section').style.display = 'none';
document.getElementById('profile-section').style.display = 'block';
```

---

### 4. СЕКЦИИ КОНТЕНТА (одинаковая структура у каждой)

Каждая секция (tournaments, teams, matches, statistics) построена по одному шаблону:

```html
<section id="tournaments">
    <!-- Заголовок -->
    <h2><i class="fas fa-trophy"></i> Tournaments</h2>

    <!-- Счётчики статистики -->
    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-number" id="total-tournaments">0</span>
            <span class="stat-label">Total</span>
        </div>
        ...
    </div>

    <!-- Фильтры и кнопки -->
    <button id="create-tournament-btn" style="display: none;">...</button>

    <!-- Контейнер для динамического контента -->
    <div class="cards-grid" id="tournaments-list">
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    </div>

    <!-- Состояние "пусто" (скрыто) -->
    <div class="empty-state" id="tournaments-empty" style="display: none;">
        <h3>No tournaments yet</h3>
    </div>
</section>
```

**Три состояния контейнера:**
1. **loading** — показан спиннер (по умолчанию)
2. **loaded** — спиннер убирается, карточки добавляются через JS
3. **empty** — если данных нет, показывается empty-state

**`id="tournaments-list"`** — JS находит этот элемент и вставляет туда HTML карточек.

---

### 5. FOOTER — подвал
```html
<footer class="footer">
    <p>&copy; <span id="footer-year"></span> 11UNITY</p>
</footer>
```
`id="footer-year"` — JS вставляет текущий год:
```js
document.getElementById('footer-year').textContent = new Date().getFullYear();
```

---

### 6. JAVASCRIPT — порядок загрузки (ОЧЕНЬ ВАЖНО!)
```html
<!-- В самом конце body — после всего HTML -->
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
<script src="./js/config.js"></script>     ← 1. Конфиг (API URL)
<script src="./js/i18n.js"></script>       ← 2. Система переводов
<script src="./locales/en.js"></script>    ← 3. Переводы EN
<script src="./locales/ru.js"></script>    ← 4. Переводы RU
<script src="./locales/hy.js"></script>    ← 5. Переводы HY
<script src="./locales/ge.js"></script>    ← 6. Переводы GE
<script src="./js/api.js"></script>        ← 7. HTTP запросы
<script src="./js/websocket.js"></script>  ← 8. WebSocket
<script src="./js/auth.js"></script>       ← 9. Авторизация
<script src="./js/ui.js"></script>         ← 10. UI компоненты
<script src="./js/tournaments.js"></script>← 11. Турниры
<script src="./js/teams.js"></script>      ← 12. Команды
<script src="./js/matches.js"></script>    ← 13. Матчи
<script src="./js/statistics.js"></script> ← 14. Статистика
<script src="./js/main.js"></script>       ← 15. Главный файл (ПОСЛЕДНИЙ!)
```

**Почему порядок важен?**
- `config.js` должен быть первым — все остальные используют CONFIG
- `i18n.js` до локалей — сначала система, потом данные
- `api.js` до auth.js — auth использует API
- `main.js` последний — он вызывает функции из всех других файлов

**Почему скрипты в конце body а не в head?**
HTML загружается сверху вниз. Если скрипты в head — JS попытается найти элементы которых ещё нет (они ниже). В конце body — весь HTML уже загружен.

---

## 🔑 HTML концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| SPA | Single Page Application — один HTML файл, JS меняет контент |
| `id="name"` | Уникальный идентификатор элемента |
| `class="name"` | CSS класс (может быть у многих элементов) |
| `data-*` атрибуты | Кастомные атрибуты, читаются через JS `element.dataset` |
| `style="display:none"` | Скрыть элемент |
| `href="#section"` | Якорная ссылка к id на странице |
| `<i class="fas fa-trophy">` | Иконка Font Awesome |
| `<section>` | Семантический тег для секции страницы |
| `<link rel="stylesheet">` | Подключить CSS файл |
| `<script src="">` | Подключить JS файл |

---

## ❓ Вопросы с защиты

**Q: Что такое SPA и почему вы выбрали такой подход?**
A: Single Page Application — весь сайт в одном HTML файле. JavaScript динамически обновляет контент без перезагрузки страницы. Преимущества: быстрее (нет перезагрузок), лучше UX, проще для нашего проекта.

**Q: Зачем скрипты в конце body?**
A: Когда браузер встречает script — он останавливает рендеринг HTML и выполняет JS. Если скрипты в head — DOM ещё не готов, JS не найдёт элементы. В конце body — весь HTML уже загружен и доступен.

**Q: Что такое data-i18n атрибут?**
A: Кастомный атрибут для системы переводов. i18n.js находит все элементы с data-i18n и заменяет их текст на перевод из текущего языка. Например data-i18n="nav.home" → "Home" (EN) или "Главная" (RU).

**Q: Почему hero-section и profile-section оба в HTML но один скрыт?**
A: При загрузке страницы гость видит hero с "Get Started". После входа JS скрывает hero (display:none) и показывает profile-section с данными пользователя. Оба существуют в DOM всегда.

**Q: Зачем loading-indicator внутри lists?**
A: По умолчанию показывается спиннер. Когда JS загрузил данные с сервера — он удаляет спиннер и вставляет карточки. Пользователь видит что данные загружаются.

**Q: Зачем config.js загружается первым?**
A: В config.js хранится CONFIG.API_URL = 'http://localhost:3000/api'. Все остальные файлы используют CONFIG. Если config.js загрузится после api.js — будет ошибка "CONFIG is not defined".
