# 📁 Файл: frontend/js/statistics.js

## Что это такое?
Самый короткий модуль из всех — 282 строки.
Показывает статистику двух видов:
1. **Глобальная** — общие цифры по всей платформе (турниры, команды, матчи, игроки, голы)
2. **По турниру** — таблица standings + топ бомбардиров/ассистентов конкретного турнира

---

## СТРУКТУРА объекта

```js
const Statistics = {
    data: null,           // глобальная статистика (от API.getStatistics)
    tournamentData: null, // статистика турнира (standings + topScorers)
    currentMode: 'global' // 'global' или id турнира (число как строка)
};
```

---

## ФУНКЦИЯ: init()

```js
init() {
    this.attachEventListeners();  // слушать смену select
    this.loadTournamentsList();   // заполнить дропдаун турниров
    this.load();                  // загрузить глобальную статистику

    window.addEventListener('languageChanged', () => {
        this.render();  // перерисовать при смене языка
    });
},
```

---

## ФУНКЦИЯ: attachEventListeners() — переключатель режима

```js
attachEventListeners() {
    const select = document.getElementById('statistics-tournament-select');
    select.addEventListener('change', (e) => {
        this.currentMode = e.target.value;  // 'global' или '5' (id турнира)

        if (this.currentMode === 'global') {
            this.load();                          // загрузить глобальную
        } else {
            this.loadTournamentStats(this.currentMode);  // загрузить по турниру
        }
    });
},
```

Один select управляет двумя режимами. Значение `'global'` — специальное зарезервированное слово.
Любое другое значение — id турнира.

---

## ФУНКЦИЯ: loadTournamentsList() — заполнить дропдаун

```js
async loadTournamentsList() {
    const response = await API.request('/statistics/tournaments');
    const tournaments = response.tournaments || [];

    // Сохранить первую опцию "Global"
    select.innerHTML = `<option value="global">${t('statistics.global')}</option>`;

    tournaments.forEach(tournament => {
        const option = document.createElement('option');
        option.value = tournament.id;

        // Эмодзи-индикатор статуса
        const statusIcon = tournament.status === 'active'   ? '🟢'
                         : tournament.status === 'upcoming' ? '🟡'
                         : '⚪';

        option.textContent = `${statusIcon} ${tournament.name}`;
        select.appendChild(option);
    });
},
```

**Вложенный тернарный оператор:**
```js
const statusIcon = tournament.status === 'active'   ? '🟢'
                 : tournament.status === 'upcoming' ? '🟡'
                 : '⚪';
// Если active  → зелёный
// Если upcoming → жёлтый
// Иначе (finished) → серый
```
Читается сверху вниз: сначала первое условие, если нет — второе, если нет — default.

---

## ФУНКЦИЯ: render() — диспетчер рендеринга

```js
render() {
    if (this.currentMode === 'global') {
        this.renderGlobal();
    } else {
        this.renderTournament();
    }
},
```

Простой диспетчер — выбирает нужную функцию рендеринга по режиму.
Паттерн часто встречается в больших приложениях.

---

## ФУНКЦИЯ: renderGlobal() — глобальная статистика

```js
renderGlobal() {
    const t = (key) => window.I18n ? I18n.t(key) : key;
    const fn = (num) => window.I18n && I18n.formatNumber ? I18n.formatNumber(num) : num;
    //          ^^ fn = format number (форматировать число по локали)

    container.innerHTML = `
        <!-- 5 карточек с цифрами -->
        <div class="stats-grid stats-grid-5">
            <div class="stat-card">
                <span class="stat-number">${fn(this.data.tournaments)}</span>
                <span class="stat-label">${t('statistics.tournaments')}</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${fn(this.data.teams)}</span>
                <span class="stat-label">${t('statistics.teams')}</span>
            </div>
            ...
        </div>

        <!-- Топ бомбардиры и ассистенты -->
        <div class="statistics-lists">
            <div class="statistics-list-card">
                <h3>Top Scorers</h3>
                ${this.renderTopList(this.data.topScorers, 'goals', 'fas fa-futbol')}
            </div>
            <div class="statistics-list-card">
                <h3>Top Assists</h3>
                ${this.renderTopList(this.data.topAssists, 'assists', 'fas fa-hands-helping')}
            </div>
        </div>
    `;
},
```

**`fn = (num) => I18n.formatNumber(num)`** — форматирование числа по локали:
```js
I18n.formatNumber(1000)  // → '1,000' (en-US) или '1 000' (ru-RU)
```
Числа отображаются в удобном для языка формате.

---

## ФУНКЦИЯ: renderTournament() — статистика турнира

```js
renderTournament() {
    // Деструктуризация объекта ответа сервера
    const { tournament, standings, topScorers, topAssists } = this.tournamentData;

    container.innerHTML = `
        <!-- Таблица -->
        <div class="standings-section">
            <h3>Standings</h3>
            ${this.renderStandingsTable(standings)}
        </div>

        <!-- Топ списки -->
        <div class="statistics-lists">
            ${this.renderTopList(topScorers, 'goals', 'fas fa-futbol')}
            ${this.renderTopList(topAssists, 'assists', 'fas fa-hands-helping')}
        </div>
    `;
},
```

**Деструктуризация объекта:**
```js
const { tournament, standings, topScorers, topAssists } = this.tournamentData;
// Вместо:
const tournament = this.tournamentData.tournament;
const standings = this.tournamentData.standings;
// и т.д.
```

---

## ФУНКЦИЯ: renderTopList() — универсальный топ-список

```js
renderTopList(list, valueKey, iconClass) {
    if (!list || list.length === 0) {
        return `<p class="statistics-empty">No data</p>`;
    }

    return `
        <ul class="statistics-ranking">
            ${list.map((item, index) => `
                <li class="ranking-item">
                    <span class="ranking-position">${index + 1}</span>
                    <div class="ranking-info">
                        <span class="ranking-name">${item.name}</span>
                        <span class="ranking-team">${item.team_name || ''}</span>
                    </div>
                    <span class="ranking-value">
                        ${item[valueKey]}
                        <i class="${iconClass}"></i>
                    </span>
                </li>
            `).join('')}
        </ul>
    `;
},
```

**Универсальность через параметры:**
```js
// Для бомбардиров:
renderTopList(data.topScorers, 'goals', 'fas fa-futbol')
// item['goals'] → 7 ⚽

// Для ассистентов:
renderTopList(data.topAssists, 'assists', 'fas fa-hands-helping')
// item['assists'] → 4 🤝
```

**`item[valueKey]`** — динамический доступ к свойству объекта:
```js
const valueKey = 'goals';
item[valueKey]  // эквивалентно item.goals
// или:
const valueKey = 'assists';
item[valueKey]  // эквивалентно item.assists
```
Одна функция работает для разных полей.

---

## Архитектура: два режима, один контейнер

```
statistics-content (один div)
        ↓
render()
  ├── currentMode === 'global'  → renderGlobal()
  │     ├── 5 stat-card (цифры)
  │     └── renderTopList(scorers) + renderTopList(assists)
  │
  └── currentMode === tournament_id  → renderTournament()
        ├── renderStandingsTable(standings)
        └── renderTopList(scorers) + renderTopList(assists)
```

Один контейнер, полностью перерисовывается при смене режима.
`innerHTML = '...'` каждый раз заменяет всё содержимое.

---

## Сравнение с tournaments.js

| Аспект | statistics.js | tournaments.js |
|--------|--------------|----------------|
| Строк | 282 | 1955 |
| Модалы | нет | 5 штук |
| Редактирование | нет (только просмотр) | полное CRUD |
| Рендеринг | один контейнер | множество DOM элементов |
| Сложность | простой | сложный |

Statistics — чисто отображение. Никаких форм, никаких модалов.

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| Вложенный тернарный оператор | `a ? 'x' : b ? 'y' : 'z'` — три варианта |
| `const { a, b } = obj` | Деструктуризация объекта |
| `item[valueKey]` | Динамическое свойство объекта |
| `const fn = (n) => ...` | Локальная функция-сокращение |
| `I18n.formatNumber(num)` | Форматирование числа по локали |
| Диспетчер (dispatch pattern) | render() выбирает renderGlobal или renderTournament |
| Универсальная функция через параметры | renderTopList работает для goals и assists |

---

## ❓ Вопросы с защиты

**Q: Чем отличается глобальная статистика от статистики турнира?**
A: Глобальная — общие цифры всей платформы: сколько всего турниров, команд, матчей, игроков, голов. Плюс топ бомбардиры по всем турнирам. Статистика турнира — таблица standings конкретного турнира плюс топ бомбардиры/ассистенты только этого турнира.

**Q: Как работает переключение между режимами?**
A: Select дропдаун. Первая опция value="global" — глобальный режим. Остальные опции — id турниров. При изменении select срабатывает событие change. Если выбрали "global" → загружаем глобальную статистику. Если выбрали число → загружаем статистику конкретного турнира.

**Q: Почему renderTopList — универсальная функция?**
A: Принимает три параметра: список данных, название поля со значением (goals или assists), CSS класс иконки. Через item[valueKey] динамически берёт нужное поле. Одна функция заменяет два одинаковых куска кода.

**Q: Что такое деструктуризация объекта?**
A: Синтаксис для извлечения свойств объекта в переменные. Вместо `const x = obj.x; const y = obj.y;` пишем `const { x, y } = obj;`. Короче и читаемее. Применяется когда нужно несколько свойств из одного объекта.

**Q: Зачем fn = (num) => I18n.formatNumber(num)?**
A: Числа в разных языках форматируются по-разному. В английском: 1,000,000. В русском: 1 000 000. formatNumber форматирует по текущей локали. fn — короткое имя чтобы не писать длинное выражение везде.
