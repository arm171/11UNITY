# 📁 CSS файлы: reset.css, variables.css, main.css, components.css

## Что это такое?
4 CSS файла которые вместе создают весь визуальный дизайн проекта.
Загружаются в index.html строго по порядку: reset → variables → main → components.

---

## 1. reset.css (62 строки) — сброс браузерных стилей

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
```

**`* { margin:0; padding:0 }`** — убирает отступы у ВСЕХ элементов.
Каждый браузер по умолчанию добавляет свои отступы — h1 имеет `margin`, ul имеет `padding`.
Reset делает все элементы одинаковыми в разных браузерах.

**`box-sizing: border-box`** — очень важное правило:
```css
/* Без border-box (content-box по умолчанию): */
div { width: 200px; padding: 20px; }
/* Реальная ширина = 200 + 20 + 20 = 240px  ← НЕОЖИДАННО */

/* С border-box: */
div { width: 200px; padding: 20px; box-sizing: border-box; }
/* Реальная ширина = 200px ← padding ВКЛЮЧЁН в width  */
```

Другие важные правила reset.css:
```css
html {
    scroll-behavior: smooth;  /* плавная прокрутка при якорных ссылках */
}

button {
    cursor: pointer;
    font-family: inherit;  /* кнопки берут шрифт от родителя */
    background: none;      /* убрать серый фон браузера */
    border: none;
}

a {
    text-decoration: none;  /* убрать подчёркивание */
    color: inherit;
}

img {
    max-width: 100%;  /* изображения не вылезают за контейнер */
    display: block;
}
```

---

## 2. variables.css (144 строки) — дизайн-система

### Концепция CSS Custom Properties (переменные)

```css
:root {
    --color-primary: #2ecc71;
}
```

**`:root`** — псевдокласс корневого элемента (= `html`). Переменные объявленные здесь доступны везде.

**Использование:**
```css
.btn-primary {
    background: var(--color-primary);  /* → #2ecc71 (зелёный) */
}
```

**Зачем?** Вместо #2ecc71 везде — одна точка правды.
Хочешь сменить зелёный на синий? Меняешь одну строку в `:root`.

### Цвета

```css
:root {
    /* Основной цвет — зелёный (цвет футбольного поля) */
    --color-primary: #2ecc71;
    --color-primary-dark: #27ae60;    /* темнее для hover */
    --color-primary-light: #58d68d;   /* светлее */

    /* Тёмный фон */
    --color-bg-dark: #0a0a0a;         /* почти чёрный */
    --color-bg-card: rgba(255,255,255,0.05);   /* карточки: белый 5% */
    --color-bg-modal: rgba(15,15,15,0.98);     /* модальные окна */
    --color-surface: #1a1a2e;         /* поверхности */

    /* Текст */
    --color-text-primary: #ffffff;    /* белый — основной */
    --color-text-secondary: #b0b0b0;  /* серый — вторичный */
    --color-text-muted: #666666;      /* тёмно-серый — подсказки */

    /* Статусы */
    --color-status-active: #2ecc71;   /* зелёный */
    --color-status-upcoming: #f39c12; /* оранжевый */
    --color-status-finished: #7f8c8d; /* серый */

    /* Системные */
    --color-success: #2ecc71;
    --color-error: #e74c3c;
    --color-warning: #f39c12;
    --color-info: #3498db;
}
```

### Типографика

```css
:root {
    /* Размеры шрифта — от xs до 4xl */
    --font-size-xs: 0.75rem;    /* 12px */
    --font-size-sm: 0.875rem;   /* 14px */
    --font-size-base: 1rem;     /* 16px ← базовый */
    --font-size-lg: 1.125rem;   /* 18px */
    --font-size-xl: 1.25rem;    /* 20px */
    --font-size-2xl: 1.5rem;    /* 24px */
    --font-size-3xl: 1.875rem;  /* 30px */
    --font-size-4xl: 2.25rem;   /* 36px */

    /* Вес */
    --font-weight-normal: 400;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
}
```

**`rem`** — relative to root element. `1rem = 16px` (размер шрифта html).
Если пользователь меняет шрифт браузера, rem масштабируется вместе с ним.

### Отступы

```css
:root {
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;
    --space-2xl: 48px;
    --space-3xl: 64px;
}
```

Система 4px grid — все отступы кратны 4px. Визуально выглядит гармонично.

### Скругления (border-radius)

```css
:root {
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 24px;
    --radius-full: 9999px;  /* идеальный круг / pill */
}
```

**`--radius-full: 9999px`** — очень большое число = всегда будет круглый угол.
Используется для badges и кнопок-пилюль.

### Z-index слои

```css
:root {
    --z-dropdown: 1000;      /* выпадающие меню */
    --z-sticky: 1100;        /* sticky header */
    --z-modal-overlay: 9000; /* тёмный фон модала */
    --z-modal: 9999;         /* сам модал */
    --z-notification: 10000; /* уведомления — ПОВЕРХ всего */
}
```

Иерархия z-index — кто над кем:
```
10000: Notifications (уведомления — всегда видны)
 9999: Modal (модальные окна)
 9000: Modal overlay (тёмный фон)
 1100: Sticky header
 1000: Dropdowns (языковой, фильтры)
    1: Обычный контент
```

### Custom scrollbar

```css
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, var(--color-primary), var(--color-primary-dark));
    border-radius: 3px;
}
```

`::-webkit-scrollbar` — псевдоэлемент только для браузеров Webkit (Chrome, Safari, Edge).
Создаёт тонкий зелёный scrollbar вместо стандартного серого.

---

## 3. main.css (1960 строк) — основные стили

### body и фон

```css
body {
    font-family: 'Inter', sans-serif;
    background: var(--color-bg-dark);
    background-image: url('../img/football_field.jpg');
    background-size: cover;
    background-attachment: fixed;
    color: var(--color-text-primary);
    min-height: 100vh;
}

body::after {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.4);
    z-index: -1;
    pointer-events: none;
}
```

**`background-attachment: fixed`** — фон не прокручивается вместе со страницей (parallax эффект).

**`body::after`** — псевдоэлемент создаёт тёмный оверлей 40% поверх фотографии поля.
Техника: `content: ''` (обязательно), `position: fixed` (везде), `z-index: -1` (под контентом).
Делает текст читаемым на любом фоне.

### Header / Navigation

```css
.header {
    position: sticky;
    top: 0;
    backdrop-filter: blur(10px);
    background: rgba(0, 0, 0, 0.3);
    z-index: var(--z-sticky);
    border-bottom: 1px solid rgba(255,255,255,0.1);
}
```

**`position: sticky`** — шапка "прилипает" к верху при прокрутке.
В отличие от `fixed`, не выбивает из потока документа до момента прилипания.

**`backdrop-filter: blur(10px)`** — размытие фона за элементом.
Эффект "матового стекла" — виден контент снизу, но размытый.

### Анимация подчёркивания ссылок

```css
.nav-link {
    position: relative;
}

.nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;         /* начальная ширина — 0 */
    height: 2px;
    background: var(--color-primary);
    transition: width var(--transition-base);
}

.nav-link:hover::after,
.nav-link.active::after {
    width: 100%;      /* конечная ширина — 100% */
}
```

Паттерн "grow underline":
- `::after` создаёт невидимую линию (width: 0)
- При hover/active — линия вырастает до 100% (width: 100%)
- `transition` делает это плавным

### Кнопка "Get Started" — показ/скрытие

```css
.get-started-btn {
    display: none;   /* скрыта по умолчанию */
}

.get-started-btn.show {
    display: inline-flex;  /* показать когда не залогинен */
}
```

JS добавляет/убирает класс `.show` в зависимости от авторизации.

### Фильтр цвета логотипа

```css
.logo img {
    filter: brightness(0) saturate(100%) invert(64%)
            sepia(62%) saturate(500%) hue-rotate(95deg) brightness(95%);
}
```

Цепочка CSS filter:
1. `brightness(0)` — делает изображение полностью чёрным
2. `invert(64%)` + `sepia(62%)` + `saturate(500%)` + `hue-rotate(95deg)` — перекрашивает в зелёный
Позволяет сделать white/black логотип любого цвета через CSS без редактирования файла.

### Карточки с эффектом при hover

```css
.tournament-card:hover {
    box-shadow: var(--shadow-primary-glow);
    /* → 0 0 30px rgba(46, 204, 113, 0.2) — зелёное свечение */
    transform: translateY(-8px);
    border-color: rgba(46, 204, 113, 0.3);
}
```

Тройной hover-эффект: поднятие вверх + тень + зелёная рамка.

### Match cards — цветная полоса

```css
.match-card {
    border-left: 4px solid rgba(255,255,255,0.1);
}

.match-card.finished {
    border-left-color: var(--color-primary);  /* зелёная полоса */
}

.match-card.scheduled {
    border-left-color: var(--color-status-upcoming); /* оранжевая */
}
```

Цвет левой полосы = визуальный индикатор статуса без текста.

### Events — два столбца

```css
.events-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;  /* два равных столбца */
    gap: 24px;
}

.events-right .event-item {
    flex-direction: row-reverse;  /* зеркальный порядок для правой команды */
}
```

Левый столбец: команда 1 (минута → иконка → имя)
Правый столбец: команда 2 (имя → иконка → минута) — зеркально через `row-reverse`

### Stats grid

```css
.stats-grid-5 {
    grid-template-columns: repeat(5, 1fr) !important;
}
```

`repeat(5, 1fr)` — 5 равных колонок.
`!important` — переопределяет базовый `.stats-grid` который был бы 3 колонки.

### Mobile Menu — burger анимация

```css
/* Начальное состояние: три горизонтальные линии */
.burger-line { width: 24px; height: 2px; }

/* При открытии меню (.active): */
.burger-btn.active .burger-line:nth-child(1) {
    transform: translateY(8px) rotate(45deg);  /* ↗ диагональ */
}
.burger-btn.active .burger-line:nth-child(2) {
    opacity: 0;  /* средняя линия исчезает */
}
.burger-btn.active .burger-line:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg); /* ↘ диагональ */
}
```

Три линии превращаются в крестик X:
- Линия 1 опускается на 8px и поворачивается на 45°
- Линия 2 исчезает
- Линия 3 поднимается на 8px и поворачивается на -45°

### Staggered animation (анимация с задержкой)

```css
.mobile-nav-overlay.active .mobile-nav-list li:nth-child(1) { transition-delay: 0.1s; }
.mobile-nav-overlay.active .mobile-nav-list li:nth-child(2) { transition-delay: 0.15s; }
.mobile-nav-overlay.active .mobile-nav-list li:nth-child(3) { transition-delay: 0.2s; }
.mobile-nav-overlay.active .mobile-nav-list li:nth-child(4) { transition-delay: 0.25s; }
.mobile-nav-overlay.active .mobile-nav-list li:nth-child(5) { transition-delay: 0.3s; }
```

Каждый пункт меню появляется с задержкой +50ms — каскадный эффект появления сверху вниз.
`:nth-child(n)` — выбрать n-й дочерний элемент.

### Responsive Design

Два брейкпоинта:
```css
@media (max-width: 768px) {
    /* Планшеты и маленькие экраны */
    .cards-grid { grid-template-columns: 1fr; }       /* карточки в 1 колонку */
    .stats-grid-5 { grid-template-columns: repeat(2, 1fr); } /* 5→2 колонки */
    .match-content { flex-direction: column; }         /* матч вертикально */
}

@media (max-width: 480px) {
    /* Смартфоны */
    .stats-grid-5 { grid-template-columns: 1fr; }     /* 2→1 колонка */
}
```

Последний блок статистики на 480px:
```css
.stats-grid-5 .stat-card:last-child {
    grid-column: span 2;  /* 5-я карточка занимает 2 колонки (при 2+2+1 → 2+2+2) */
}
```

---

## 4. components.css (753 строки) — переиспользуемые компоненты

### Кнопки

```css
/* Базовая кнопка */
.btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-xl);
    border-radius: var(--radius-md);
    transition: all var(--transition-base);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;  /* ← иконка запрета */
}
```

Варианты:
| Класс | Цвет | Использование |
|-------|------|---------------|
| `.btn-primary` | Зелёный | Главные действия |
| `.btn-secondary` | Белый 10% | Второстепенные |
| `.btn-danger` | Красный | Удаление |
| `.btn-success` | Зелёный | Подтверждение |
| `.btn-outline` | Прозрачный + рамка | Альтернатива |
| `.btn-icon` | 44×44 квадрат | Иконки без текста |

Размеры: `.btn-sm` (маленький), без класса (базовый), `.btn-lg` (большой).

**`:hover:not(:disabled)`** — hover эффект ТОЛЬКО если кнопка не disabled:
```css
.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);  /* поднять вверх */
}
```

### Модальные окна

```css
.modal {
    position: fixed;
    z-index: var(--z-modal);
    display: none;           /* скрыт по умолчанию */
    align-items: center;
    justify-content: center;
}

.modal.active {
    display: flex;           /* показать */
}
```

Паттерн: `display:none` → `display:flex` через класс `.active`.

```css
.modal-overlay {
    position: absolute;  /* абсолютно внутри modal */
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(5px);
}

.modal-content {
    position: relative;
    z-index: 1;          /* выше overlay */
    max-height: 90vh;
    overflow-y: auto;    /* скролл если содержимое не влезает */
}
```

Кнопка закрытия X:
```css
.modal-close:hover {
    background: rgba(231, 76, 60, 0.3);  /* красноватый при hover */
    transform: rotate(90deg);             /* поворот на 90° */
}
```

### Формы

```css
.form-input:focus {
    outline: none;                           /* убрать браузерную рамку */
    border-color: var(--color-primary);      /* зелёная рамка */
    box-shadow: 0 0 0 3px rgba(46,204,113,0.1); /* зелёное свечение */
}
```

**`box-shadow: 0 0 0 3px color`** — нет тени, только "кольцо" 3px вокруг. Эффект focus ring.

Select с кастомной стрелкой:
```css
.form-select {
    appearance: none;  /* убрать стандартную стрелку */
    background-image: url("data:image/svg+xml,...");  /* кастомная стрелка */
    background-position: right 16px center;
}
```

**`appearance: none`** + `background-image` с inline SVG = полностью кастомный dropdown.

**`data:image/svg+xml`** — SVG прямо в CSS, без файла.

### Color Picker

```css
.form-color-input::-webkit-color-swatch-wrapper {
    padding: 0;           /* убрать внутренний отступ */
}
.form-color-input::-webkit-color-swatch {
    border: none;         /* убрать рамку */
    border-radius: 8px;   /* скруглить цветной квадрат */
}
```

`::-webkit-color-swatch` — псевдоэлемент внутри `<input type="color">`.
Позволяет кастомизировать цветной квадрат внутри пикера.

### Badges (статусы)

```css
.badge {
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-full);  /* pill форма */
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-active { background: var(--color-status-active); }  /* зелёный */
.badge-upcoming { background: var(--color-status-upcoming); } /* оранжевый */
.badge-finished { background: var(--color-status-finished); } /* серый */
```

### Loading Spinner

```css
.spinner {
    border: 4px solid rgba(255,255,255,0.1);
    border-top-color: var(--color-primary);  /* только верхняя часть зелёная */
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

Круг с одним зелёным краем + бесконечное вращение = spinner.
`from` не нужен (подразумевается `rotate(0deg)`).

### Notifications

```css
.notification {
    position: fixed;
    top: 100px;
    right: var(--space-xl);
    z-index: var(--z-notification);  /* 10000 — поверх всего */
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);  /* начало — справа за экраном */
        opacity: 0;
    }
    to {
        transform: translateX(0);      /* конец — на месте */
        opacity: 1;
    }
}
```

Уведомление вылетает справа. `from translateX(400px)` — за правым краем экрана.

### Auth Tabs (Login/Register)

```css
.auth-form-container {
    display: none;
    animation: fadeIn 0.3s ease;
}

.auth-form-container.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

Форма появляется с небольшим подъёмом снизу. `translateY(10px)` → `translateY(0)`.

### Language Switcher

```css
.lang-dropdown {
    opacity: 0;
    visibility: hidden;     /* скрыт, но занимает место в DOM */
    transform: translateY(-10px);
    transition: all 0.2s ease;
}

.lang-dropdown.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}
```

**`visibility: hidden` vs `display: none`:**
- `display: none` — полностью убирает из потока (нельзя плавно анимировать)
- `visibility: hidden` — скрывает, но оставляет в DOM (можно анимировать через `opacity`)

Оба нужны вместе: `opacity: 0` делает невидимым, `visibility: hidden` отключает клики.

---

## Архитектура: как файлы связаны

```
reset.css          → сбрасывает браузерные стили
    ↓
variables.css      → объявляет все переменные (:root)
    ↓
main.css           → стили страницы, использует var(--...)
    ↓
components.css     → кнопки, модалы, формы — переиспользуемые блоки
```

Порядок важен: variables.css должен быть ДО main.css, иначе переменные не определены.

---

## 🔑 CSS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `:root { --var: value }` | CSS переменные — одна точка правды |
| `var(--name)` | Использование переменной |
| `box-sizing: border-box` | Padding включён в width (не добавляется к нему) |
| `position: sticky` | Прилипает к верху при прокрутке |
| `backdrop-filter: blur()` | Размытие фона за элементом — "матовое стекло" |
| `body::after` | Псевдоэлемент — тёмный оверлей поверх фото |
| `::after` underline animation | `width: 0` → `width: 100%` при hover |
| `display: none` → `display: flex` | Показ/скрытие через класс `.active` |
| `visibility: hidden` vs `display: none` | hidden — можно анимировать, none — нельзя |
| CSS `filter:` chain | Перекрасить логотип через цепочку фильтров |
| `:nth-child(n)` | Выбрать n-й дочерний элемент |
| `transition-delay` | Задержка анимации — staggered effect |
| `@keyframes` | Определение CSS анимации |
| `@media (max-width: Npx)` | Медиа-запросы для адаптивности |
| `grid-template-columns: repeat(N, 1fr)` | N равных колонок в grid |
| `grid-column: span 2` | Ячейка занимает 2 колонки |
| `flex-direction: row-reverse` | Зеркальный порядок элементов |
| `:hover:not(:disabled)` | hover только если НЕ disabled |
| `appearance: none` + inline SVG | Кастомный select |
| `data:image/svg+xml` | SVG прямо в CSS без файла |
| `border-top-color` + `animation: spin` | Loading spinner |
| `translateX(400px)` → `translateX(0)` | Slide-in анимация уведомления |
| `transform: rotate(90deg)` на ✕ | Поворот крестика при hover |
| `transition-delay: 0.1s, 0.15s...` | Каскадная анимация пунктов меню |

---

## ❓ Вопросы с защиты

**Q: Зачем reset.css?**
A: Каждый браузер добавляет свои стили по умолчанию — Chrome, Firefox, Safari ведут себя по-разному. Reset убирает все эти различия и делает точку отсчёта одинаковой. После reset'а мы сами контролируем все отступы и стили.

**Q: Что такое CSS Custom Properties и зачем они нужны?**
A: Переменные CSS — объявляются в `:root`, используются через `var()`. Основная польза — одна точка правды. Если хочу сменить основной зелёный цвет, меняю `--color-primary` в одном месте и цвет меняется везде: кнопки, hover эффекты, badges, spinner. Без переменных пришлось бы менять #2ecc71 в 50+ местах.

**Q: Как работает тёмный оверлей поверх фото поля?**
A: `body::after` создаёт псевдоэлемент с `content: ''`. `position: fixed` растягивает его на весь экран. `background: rgba(0,0,0,0.4)` — чёрный 40% прозрачности. `z-index: -1` — за контентом, перед фото. Результат — фото поля видно, но приглушено, текст читаем.

**Q: Чем `position: sticky` отличается от `position: fixed`?**
A: `fixed` всегда вырван из потока — другие элементы не видят его и он перекрывает контент. `sticky` находится в потоке как обычный элемент, пока не достигнет top:0 при прокрутке — тогда "прилипает". Шапка с sticky не перекрывает hero секцию при загрузке страницы.

**Q: Как работает burger анимация → крестик?**
A: `.burger-btn` содержит 3 `span.burger-line` (полоски). При клике JS добавляет класс `.active`. CSS: первая полоска — `translateY(8px) rotate(45deg)` (опускается и наклоняется ↗). Средняя — `opacity: 0` (исчезает). Третья — `translateY(-8px) rotate(-45deg)` (поднимается ↘). Вместе две диагонали образуют X.

**Q: Почему у language dropdown используется `visibility: hidden` вместо `display: none`?**
A: `display: none` полностью убирает элемент из рендеринга — нельзя плавно анимировать появление, браузер не успевает применить переход. `visibility: hidden` скрывает визуально но элемент остаётся в DOM — можно анимировать через `opacity: 0 → 1` с `transition`. Пара `opacity + visibility` = стандартный паттерн для анимированных dropdown.

**Q: Что делает `backdrop-filter: blur(10px)`?**
A: Размывает всё что находится ЗА элементом (за его фоном). Создаёт эффект "матового стекла" — контент снизу виден, но нечётко. Используется в header и модальных окнах для красивого полупрозрачного вида.
