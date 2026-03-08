# 📁 Файл: frontend/js/matches.js

## Что это такое?
Модуль отображения матчей — 443 строки (самый короткий из крупных модулей).
Только отображение и фильтрация — ввод голов/карточек делается в tournaments.js.

Функции:
- Загрузить все матчи всех турниров
- Фильтровать по турниру и статусу
- Группировать по дате
- Показать детали матча (счёт + события по колонкам)

---

## СТРУКТУРА объекта

```js
const Matches = {
    matches: [],              // все загруженные матчи
    tournaments: [],          // все турниры (для фильтра)
    currentFilter: 'all',     // фильтр по турниру (id или 'all')
    currentStatusFilter: 'all' // фильтр по статусу ('all', 'upcoming', 'finished')
};
```

---

## ФУНКЦИЯ: load() — загрузить данные

```js
async load() {
    UI.showLoading('matches-list');

    // Загружаем матчи и турниры ПАРАЛЛЕЛЬНО
    const [matchesResponse, tournamentsResponse] = await Promise.all([
        API.getMatches(),
        API.getTournaments()
    ]);

    this.matches = matchesResponse.matches || [];
    this.tournaments = tournamentsResponse.tournaments || [];

    this.updateFilterOptions(); // заполнить дропдаун турниров
    this.updateStats();         // счётчики
    this.render();              // отрисовать
},
```

**Деструктуризация массива с Promise.all:**
```js
const [a, b] = await Promise.all([fetch1(), fetch2()]);
// a = результат fetch1
// b = результат fetch2
// Оба запроса выполняются одновременно
```

Турниры загружаются чтобы заполнить фильтр-дропдаун именами турниров.

---

## ФУНКЦИЯ: updateFilterOptions() — дропдаун фильтрации

```js
updateFilterOptions() {
    const filterSelect = document.getElementById('matches-filter');

    // Функция-обёртка для перевода
    const t = (key) => window.I18n ? I18n.t(key) : key;

    // Первая опция — "All Tournaments"
    filterSelect.innerHTML = `<option value="all">${t('matches.allTournaments')}</option>`;

    // Добавить каждый турнир
    this.tournaments.forEach(tournament => {
        const option = document.createElement('option');
        option.value = tournament.id;
        option.textContent = tournament.name;
        filterSelect.appendChild(option);
    });

    // Восстановить выбранный фильтр
    filterSelect.value = this.currentFilter;
},
```

**`const t = (key) => ...`** — локальная функция-сокращение:
```js
// Вместо писать везде:
window.I18n ? I18n.t('key') : 'key'

// Создаём shortcut:
const t = (key) => window.I18n ? I18n.t(key) : key;
t('matches.allTournaments')  // чище и короче
```

**`filterSelect.value = this.currentFilter`** — восстановить текущий выбор.
Если раньше был выбран турнир с id=3, после перезагрузки дропдауна снова выбрать его.

---

## ФУНКЦИЯ: render() — отрисовка с двойным фильтром

```js
render() {
    // Начинаем с полного списка
    let filteredMatches = this.matches;

    // Фильтр 1: по турниру
    if (this.currentFilter !== 'all') {
        filteredMatches = filteredMatches.filter(m => m.tournament_id == this.currentFilter);
        //                                                             ^^ двойное == !
    }

    // Фильтр 2: по статусу
    if (this.currentStatusFilter === 'upcoming') {
        filteredMatches = filteredMatches.filter(m => m.status === 'scheduled');
    } else if (this.currentStatusFilter === 'finished') {
        filteredMatches = filteredMatches.filter(m => m.status === 'finished');
    }

    // Группировать по дате и отрисовать
    const matchesByDate = this.groupMatchesByDate(filteredMatches);

    container.innerHTML = '';
    Object.entries(matchesByDate).forEach(([date, matches]) => {
        const dateSection = this.createDateSection(date, matches);
        container.appendChild(dateSection);
    });
},
```

**Двойной фильтр — цепочка `.filter()`:**
```js
// Применяем фильтры последовательно к одному массиву:
let result = allMatches;
result = result.filter(byTournament);  // уменьшаем список
result = result.filter(byStatus);      // уменьшаем ещё
```

**`m.tournament_id == this.currentFilter`** — почему `==` а не `===`?
`tournament_id` из базы — число (5).
`this.currentFilter` из `e.target.value` (select) — строка ("5").
`==` сравнивает без учёта типа: `5 == "5"` → true.

---

## ФУНКЦИЯ: groupMatchesByDate() — группировка по дате

```js
groupMatchesByDate(matches) {
    const groups = {};
    const lang = window.I18n ? I18n.getCurrentLanguage() : 'en';

    matches.forEach(match => {
        const date = this.getDateString(match.match_date, lang);
        // date = '15 мая 2026' (по-русски) или 'May 15, 2026' (по-английски)

        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(match);
    });

    return groups;
    // { 'May 15, 2026': [match1, match2], 'May 22, 2026': [match3] }
},
```

**Ключ группировки — отформатированная дата:**
Матчи с одинаковой датой попадают в одну группу.
Дата форматируется по языку через `getDateString()` — группы будут правильно называться на любом языке.

---

## ФУНКЦИЯ: getDateString() — форматирование даты по языку

```js
getDateString(dateStr, lang) {
    const d = new Date(dateStr);

    const monthNames = {
        hy: ['Հունվար', 'Փետրվար', ...],  // армянский
        ge: ['იანვარი', 'თებერვალი', ...]  // грузинский
    };

    if (monthNames[lang]) {
        // Ручное форматирование для hy и ge
        const month = monthNames[lang][d.getMonth()];
        return `${d.getDate()} ${month} ${d.getFullYear()}`;
    }

    // Стандартное форматирование для en и ru
    const localeMap = { en: 'en-US', ru: 'ru-RU' };
    return d.toLocaleDateString(localeMap[lang] || 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
},
```

Та же логика что и в i18n.js — дублирование, потому что matches.js работает независимо.

**`month: 'long'`** — полное название месяца:
```js
{ month: 'short' }  // → 'May'
{ month: 'long' }   // → 'May' / 'Май' (полностью)
```

---

## ФУНКЦИЯ: createMatchCard() — карточка матча

```js
createMatchCard(match) {
    const isFinished = match.status === 'finished';
    const matchTime = new Date(match.match_date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    // → '18:00'

    return `
        <div class="match-card ${isFinished ? 'finished' : 'scheduled'}"
             onclick="Matches.openDetailsModal(${match.tournament_id}, ${match.id})">

            <div class="match-tournament-badge">
                <i class="fas fa-trophy"></i> ${match.tournament_name}
            </div>

            <div class="match-content">
                <!-- Команда 1 -->
                <div class="match-team team1">
                    <div class="team-logo-small" style="background: ${match.team1_color}">
                        ${match.team1_logo}
                    </div>
                    <span>${match.team1_name}</span>
                </div>

                <!-- Счёт или время -->
                <div class="match-score-section">
                    ${isFinished ? `
                        <div class="match-score">
                            <span>${match.team1_score}</span>
                            <span>:</span>
                            <span>${match.team2_score}</span>
                        </div>
                    ` : `
                        <div class="match-time">${matchTime}</div>
                    `}
                </div>

                <!-- Команда 2 -->
                <div class="match-team team2">...</div>
            </div>
        </div>
    `;
},
```

**`hour12: false`** — 24-часовой формат:
```js
{ hour12: true }   // → '06:00 PM'
{ hour12: false }  // → '18:00'
```

**Условный CSS класс:**
```js
`class="match-card ${isFinished ? 'finished' : 'scheduled'}"`
// → class="match-card finished"
// → class="match-card scheduled"
```
CSS использует эти классы для разного оформления.

---

## ФУНКЦИЯ: openDetailsModal() — детали матча

```js
async openDetailsModal(tournamentId, matchId) {
    const response = await API.request(`/tournaments/${tournamentId}/matches/${matchId}`);
    const match = response.match;

    // ...заполнить заголовок, счёт...

    // Разделить события по командам
    const team1Events = events.filter(e => e.team_id === match.team1_id);
    const team2Events = events.filter(e => e.team_id === match.team2_id);

    // Функция форматирования одного события
    const formatEvent = (event) => {
        let icon = '';
        if (event.event_type === 'goal') {
            icon = event.is_own_goal
                ? '<i class="fas fa-futbol" style="color: red;"></i>'   // автогол — красный
                : '<i class="fas fa-futbol" style="color: green;"></i>'; // гол — зелёный
        } else if (event.event_type === 'yellow_card') {
            icon = '<span style="background: yellow; ..."></span>';  // жёлтый квадрат
        } else if (event.event_type === 'red_card') {
            icon = '<span style="background: red; ..."></span>';     // красный квадрат
        }
        return `<div class="event-item">
            <span>${event.minute}'</span> ${icon} <span>${event.player_name}</span>
        </div>`;
    };

    // Два столбца — левый для команды 1, правый для команды 2
    eventsContainer.innerHTML = `
        <div class="events-two-columns">
            <div class="events-column events-left">
                <div>${match.team1_name}</div>
                ${team1Events.map(formatEvent).join('')}
            </div>
            <div class="events-column events-right">
                <div>${match.team2_name}</div>
                ${team2Events.map(formatEvent).join('')}
            </div>
        </div>
    `;
},
```

**Функция внутри функции (замыкание):**
```js
async openDetailsModal(...) {
    // formatEvent определена ВНУТРИ openDetailsModal
    const formatEvent = (event) => { ... };

    // И используется ниже
    team1Events.map(formatEvent)
}
```
`formatEvent` имеет доступ к `match` из внешней функции — это замыкание (closure).

**Разделение событий по колонкам:**
```
Левая колонка (команда 1):  | Правая колонка (команда 2):
67' ⚽ Arman               | 45' 🟨 Giorgi
78' ⚽ Arman               | 89' ⚽ Nodar
```
Пользователь видит события каждой команды отдельно.

---

## Схема работы двух фильтров

```
Все матчи: [match1, match2, match3, match4, match5]

Фильтр по турниру (id=3):
→ [match1, match3, match5]  (только из турнира 3)

Фильтр по статусу (finished):
→ [match1, match5]          (только завершённые)

Группировка по дате:
→ {
    'May 15': [match1],
    'May 22': [match5]
  }

Отрисовка:
→ Секция "May 15" с match1
→ Секция "May 22" с match5
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `const [a, b] = await Promise.all([...])` | Деструктуризация результата параллельных запросов |
| `const t = (key) => ...` | Локальная функция-сокращение |
| `let result = arr; result = result.filter(...)` | Цепочка фильтров на одном массиве |
| `m.tournament_id == this.currentFilter` | `==` для сравнения числа со строкой |
| Функция внутри функции (closure) | formatEvent имеет доступ к match внешней функции |
| `hour12: false` | 24-часовой формат времени |
| `month: 'long'` | Полное название месяца |
| Группировка по ключу-строке | Дата как ключ объекта-словаря |
| CSS класс по условию в template literal | `${isFinished ? 'finished' : 'scheduled'}` |
| `filter(e => e.team_id === team1_id)` | Разделить события по командам |

---

## ❓ Вопросы с защиты

**Q: Как работает двойная фильтрация матчей?**
A: Начинаем с полного массива. Сначала применяем фильтр по турниру (если выбран конкретный). Потом фильтр по статусу (upcoming/finished). Каждый filter() возвращает новый уменьшенный массив. В итоге render() рисует только подходящие матчи.

**Q: Зачем группировать матчи по дате?**
A: UX — удобнее смотреть расписание когда матчи сгруппированы по дням. Вместо длинного списка видим секции "15 мая", "22 мая" и т.д. Группировка делается через объект: ключ = дата, значение = массив матчей этой даты.

**Q: Почему == а не === при фильтре по турниру?**
A: tournament_id из БД — число (5). Значение из select.value — всегда строка ("5"). == сравнивает без учёта типа: 5 == "5" → true. Если использовать ===: 5 === "5" → false и фильтр не сработает.

**Q: Как события матча показываются в двух колонках?**
A: Все события фильтруем по team_id: team1Events и team2Events. Каждый массив рендерим в свою колонку. Левая — команда 1, правая — команда 2. Пользователь видит кто что сделал.

**Q: Что такое замыкание (closure) на примере formatEvent?**
A: formatEvent определена внутри openDetailsModal. Она использует переменную match из внешней функции. Даже если внешняя функция уже "выполнилась", match остаётся доступен — это и есть замыкание. Функция "замыкает" переменные из окружающего контекста.
