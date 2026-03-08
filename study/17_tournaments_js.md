# 📁 Файл: frontend/js/tournaments.js

## Что это такое?
Самый большой frontend модуль — 1955 строк.
Управляет всем что связано с турнирами: список, создание, просмотр деталей, расписание матчей, добавление голов и карточек, таблица, статистика.

---

## СТРУКТУРА объекта

```js
const Tournaments = {
    tournaments: [],          // массив всех загруженных турниров
    currentTournament: null,  // турнир который сейчас открыт в модале
    currentMatch: null,       // матч который сейчас открыт
    currentCategoryFilter: '', // фильтр по категории

    VALID_MAX_TEAMS: {        // допустимые значения команд по типу
        league: [4, 8, 12, 16, 32],
        playoff: [4, 8, 16, 32],
        group_playoff: [8, 16, 32]
    },
};
```

---

## ФУНКЦИЯ: init()

```js
init() {
    this.createModals();          // 1. Создать HTML всех модалов
    this.attachEventListeners();  // 2. Навесить обработчики
    this.load();                  // 3. Загрузить турниры с сервера
},
```

---

## ФУНКЦИЯ: createModals() — создание HTML модалов

Создаёт 5 модальных окон через `insertAdjacentHTML('beforeend', html)`:
1. `create-tournament-modal` — форма создания турнира
2. `edit-tournament-modal` — форма редактирования
3. `tournament-details-modal` — детали турнира (вкладки: Standings, Statistics, Fixtures)
4. `fixtures-settings-modal` — настройки генерации расписания
5. `match-results-modal` — управление матчем (голы, карточки)

**Зачем создавать в JS, а не в HTML?**
Чистота кода — index.html не раздувается. Модал создаётся один раз при init() и переиспользуется.

После создания:
```js
if (window.I18n) {
    I18n.applyTranslations();  // перевести data-i18n атрибуты в новых модалах
}
```

---

## ФУНКЦИЯ: load() — загрузить турниры

```js
async load() {
    UI.showLoading('tournaments-list');

    let endpoint = CONFIG.ENDPOINTS.TOURNAMENTS;  // '/tournaments'
    if (this.currentCategoryFilter) {
        endpoint += `?category=${encodeURIComponent(this.currentCategoryFilter)}`;
        // → '/tournaments?category=school'
    }

    const response = await API.request(endpoint);
    this.tournaments = response.tournaments || [];

    this.updateStats();  // обновить счётчики (всего/активных/завершённых)
    this.render();       // отрисовать карточки
},
```

**`encodeURIComponent()`** — безопасно закодировать строку для URL:
```js
encodeURIComponent('school & university')
// → 'school%20%26%20university'
```
Нужно чтобы спецсимволы (&, ?, #) не сломали URL.

---

## ФУНКЦИЯ: updateStats() — счётчики

```js
updateStats() {
    const total = this.tournaments.length;
    const active = this.tournaments.filter(t => t.status === 'active').length;
    const finished = this.tournaments.filter(t => t.status === 'finished').length;

    document.getElementById('total-tournaments').textContent = total;
    document.getElementById('active-tournaments').textContent = active;
    document.getElementById('finished-tournaments').textContent = finished;
},
```

**`.filter(fn)`** — отфильтровать массив, вернуть только подходящие элементы:
```js
[1, 2, 3, 4].filter(n => n > 2)   // → [3, 4]
this.tournaments.filter(t => t.status === 'active')  // → только активные турниры
```

---

## ФУНКЦИЯ: render() — отрисовать карточки

```js
render() {
    const container = document.getElementById('tournaments-list');

    UI.hideLoading('tournaments-list');

    if (this.tournaments.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    container.style.display = 'grid';
    container.innerHTML = '';   // очистить старые карточки

    this.tournaments.forEach(tournament => {
        const card = this.createCard(tournament);
        container.appendChild(card);
    });
},
```

**Паттерн отрисовки:**
```
1. Очистить контейнер (innerHTML = '')
2. Для каждого элемента данных создать DOM элемент
3. Добавить в контейнер (appendChild)
```

---

## ФУНКЦИЯ: createCard() — создать карточку турнира

```js
createCard(tournament) {
    const card = document.createElement('div');
    card.className = 'card tournament-card';
    card.onclick = () => this.openDetailsModal(tournament);  // клик → открыть детали

    const statusText = I18n.t(`tournaments.${tournament.status}`);
    // I18n.t('tournaments.active') → 'Active' / 'Активный'

    card.innerHTML = `
        <div class="tournament-header">
            <h3>${tournament.name}</h3>
            <span class="badge badge-${tournament.status}">${statusText}</span>
        </div>
        <div class="tournament-meta">
            <span>${I18n.t('tournaments.teamsJoined', { current: 5, max: 8 })}</span>
            // → 'Teams: 5/8'
        </div>
    `;

    return card;
},
```

**`card.onclick = () => ...`** — назначить обработчик клика через свойство (не addEventListener).
Разница: через onclick можно назначить только один обработчик, через addEventListener — несколько.

---

## ФУНКЦИЯ: openDetailsModal() — открыть детали турнира

```js
async openDetailsModal(tournament) {
    this.currentTournament = tournament;

    // Подключиться к WebSocket комнате
    if (window.WebSocketManager) {
        WebSocketManager.joinTournament(tournament.id);
    }

    // Заполнить данные в модале
    document.getElementById('modal-tournament-name').textContent = tournament.name;
    document.getElementById('modal-tournament-date').textContent = UI.formatDate(tournament.start_date);

    // Показать/скрыть кнопки для владельца
    const isOwner = user && user.role === 'organizer' && tournament.organizer_id === user.id;
    ownerActions.style.display = (isOwner && tournament.status === 'upcoming') ? 'block' : 'none';

    // Загрузить все вкладки ПАРАЛЛЕЛЬНО
    await Promise.all([
        this.loadStandings(tournament.id),
        this.loadStatistics(tournament.id),
        this.loadTournamentFixtures(tournament.id)
    ]);

    this.switchTab('standings');
    UI.openModal('tournament-details-modal');
},
```

**`Promise.all([p1, p2, p3])`** — запустить несколько async операций ПАРАЛЛЕЛЬНО:
```js
// БЕЗ Promise.all (последовательно) — медленно:
await loadStandings();    // ждём
await loadStatistics();   // ждём
await loadFixtures();     // ждём
// Итого: время1 + время2 + время3

// С Promise.all (параллельно) — быстро:
await Promise.all([loadStandings(), loadStatistics(), loadFixtures()]);
// Итого: max(время1, время2, время3)
```

---

## ФУНКЦИЯ: switchTab() — переключение вкладок

```js
switchTab(tabName) {
    // Убрать active у всех кнопок, добавить нужной
    document.querySelectorAll('.tournament-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Скрыть все контент-блоки
    document.querySelectorAll('.tournament-tab-content').forEach(content => {
        content.style.display = 'none';
    });

    // Показать нужный
    document.getElementById(`tournament-${tabName}-tab`).style.display = 'block';
},
```

**`btn.dataset.tab`** — прочитать `data-tab` атрибут:
```html
<button data-tab="standings">Standings</button>
```
```js
btn.dataset.tab  // → 'standings'
// Эквивалентно:
btn.getAttribute('data-tab')
```

**`\`tournament-${tabName}-tab\``** — динамический id:
```js
switchTab('standings') → getElementById('tournament-standings-tab')
switchTab('fixtures')  → getElementById('tournament-fixtures-tab')
```

---

## ФУНКЦИЯ: renderStandingsFromData() — таблица турнира

```js
table.innerHTML = `
    <table>
        <thead><tr>
            <th>#</th>
            <th>${I18n.t('stats.team')}</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
        </tr></thead>
        <tbody>
            ${standings.map((team, index) => `
                <tr style="background: ${index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
                    <td>${index + 1}</td>
                    <td>${team.team_name}</td>
                    <td>${team.played}</td>
                    ...
                    <td style="color: ${team.goal_difference >= 0 ? '#2ecc71' : '#e74c3c'};">
                        ${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;
```

**`index % 2 === 0`** — чётный/нечётный индекс → чередующийся фон строк (зебра).

**`team.goal_difference > 0 ? '+' : ''`** — показать плюс для положительной разницы:
```
+5 (позитивная)
-3 (негативная, JS сам поставит минус)
```

---

## ФУНКЦИЯ: loadTournamentFixtures() — расписание матчей

```js
async loadTournamentFixtures(tournamentId) {
    const response = await API.getTournamentMatches(tournamentId);
    const matches = response.matches || [];

    // Группировать матчи по раунду
    const rounds = {};
    matches.forEach(match => {
        if (!rounds[match.round]) {
            rounds[match.round] = [];
        }
        rounds[match.round].push(match);
    });
    // rounds = { 1: [match1, match2], 2: [match3, match4], ... }

    // Отсортировать раунды и отрисовать
    Object.keys(rounds).sort((a, b) => a - b).forEach(roundNum => {
        const roundDiv = document.createElement('div');
        roundDiv.innerHTML = `
            <h4>Round ${roundNum}</h4>
            ${rounds[roundNum].map(match => this.createFixtureCard(match)).join('')}
        `;
        fixturesList.appendChild(roundDiv);
    });
},
```

**Группировка через объект как словарь:**
```js
const rounds = {};
// rounds['1'] не существует → создаём пустой массив
if (!rounds[match.round]) {
    rounds[match.round] = [];
}
rounds[match.round].push(match);
```

**`Object.keys(rounds).sort((a, b) => a - b)`** — отсортировать ключи числово:
```js
Object.keys({ '2': [], '10': [], '1': [] })  // → ['2', '10', '1'] (строки!)
.sort((a, b) => a - b)                        // → ['1', '2', '10'] (числовая сортировка)
```
Без `(a, b) => a - b` строки сортировались бы лексикографически: ['1', '10', '2'].

---

## ФУНКЦИЯ: handleGenerateFixtures() — генерация расписания

```js
async handleGenerateFixtures(e) {
    e.preventDefault();

    // Собрать отмеченные дни недели
    const matchDays = Array.from(
        document.querySelectorAll('input[name="match-days"]:checked')
    ).map(cb => parseInt(cb.value));
    // → [3, 5] (среда и пятница)

    if (matchDays.length === 0) {
        throw new Error('Select at least one day');
    }

    await API.request(`/tournaments/${this.currentTournament.id}/fixtures/generate`, {
        method: 'POST',
        body: JSON.stringify({ startDate, matchTime, matchDays, matchesPerDay })
    });
},
```

**`Array.from(NodeList)`** — преобразовать NodeList в настоящий массив:
```js
document.querySelectorAll('input:checked')  // → NodeList (не массив)
Array.from(...)                              // → Array (можно .map)
```

**`input[name="match-days"]:checked`** — CSS селектор: все checkbox с именем match-days которые отмечены.

---

## ФУНКЦИЯ: handleAddGoal() — добавить гол

```js
async handleAddGoal(e) {
    e.preventDefault();

    const teamId = parseInt(document.getElementById('goal-team').value);
    const playerId = parseInt(document.getElementById('goal-player').value);
    const minute = parseInt(document.getElementById('goal-minute').value);
    const isOwnGoal = document.getElementById('goal-own-goal').checked;
    const assistPlayerId = document.getElementById('goal-assist').value
        ? parseInt(document.getElementById('goal-assist').value)
        : null;

    await API.addMatchEvent(
        this.currentMatch.tournament_id,
        this.currentMatch.id,
        { teamId, playerId, eventType: 'goal', minute, isOwnGoal, assistPlayerId }
    );

    // Перезагрузить матч (обновить счёт и список событий)
    const response = await API.getMatchDetails(...);
    this.currentMatch = response.match;
    this.updateScoreDisplay();
    this.loadMatchEvents();

    form.reset();  // очистить форму
    this.populateTeamDropdowns();  // сбросить дропдауны
},
```

**`element.checked`** — true/false, состояние checkbox:
```js
document.getElementById('goal-own-goal').checked  // → true если отмечен
```

**`parseInt(value)`** — строку в число:
```js
'42' → 42
'' → NaN (пустая строка)
```

---

## ФУНКЦИЯ: updateGoalPlayerDropdown() — динамические дропдауны

```js
updateGoalPlayerDropdown() {
    const teamId = document.getElementById('goal-team').value;
    const playerSelect = document.getElementById('goal-player');

    playerSelect.innerHTML = `<option value="">Select player</option>`;

    if (!teamId) return;

    const players = this.getTeamPlayers(teamId);
    players.forEach(p => {
        const option = document.createElement('option');
        option.value = p.player_id;
        option.textContent = `${p.jersey_number ? '#' + p.jersey_number + ' ' : ''}${p.player_name}`;
        playerSelect.appendChild(option);
    });
},
```

Когда меняется команда → список игроков обновляется.
Данные игроков приходят с сервером при загрузке матча (match.team1_players, match.team2_players).

---

## ФУНКЦИЯ: handleFinishMatch() — завершить матч

```js
async handleFinishMatch() {
    finishBtn.disabled = true;
    const originalHTML = finishBtn.innerHTML;
    finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        await API.updateMatchResult(
            this.currentMatch.tournament_id,
            this.currentMatch.id,
            { status: 'finished' }
        );

        this.closeMatchResultsModal();
        await this.load();
        if (window.Matches) Matches.load();
        if (window.Statistics) Statistics.load();

    } catch (error) {
        // Вернуть кнопку обратно если ошибка
        finishBtn.innerHTML = originalHTML;
        finishBtn.disabled = false;
    }
},
```

**Паттерн "сохранить originalHTML":**
```js
const originalHTML = finishBtn.innerHTML;  // сохранить
finishBtn.innerHTML = '<spinner>';          // заменить на спиннер

// при ошибке:
finishBtn.innerHTML = originalHTML;        // восстановить
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `array.filter(fn)` | Отфильтровать массив, оставить подходящие |
| `Promise.all([p1, p2])` | Запустить несколько async параллельно |
| `encodeURIComponent(str)` | Закодировать строку для URL |
| `Object.keys(obj).sort((a,b) => a-b)` | Числовая сортировка строковых ключей |
| `Array.from(NodeList)` | NodeList → настоящий массив |
| `input:checked` в querySelectorAll | Только отмеченные checkbox |
| `element.checked` | Состояние checkbox (true/false) |
| `btn.dataset.tab` | Прочитать data-tab атрибут |
| `index % 2 === 0` | Чётный/нечётный (для зебры) |
| `card.onclick = () => fn()` | Назначить обработчик через свойство |
| `form.reset()` | Очистить все поля формы |
| Группировка в объект как словарь | `{}` для группировки массива по ключу |
| Сохранение originalHTML | Паттерн восстановления кнопки при ошибке |

---

## ❓ Вопросы с защиты

**Q: Зачем Promise.all при открытии деталей турнира?**
A: Нужно загрузить три вещи: standings, statistics, fixtures. Если делать последовательно — ждём каждый запрос. Promise.all запускает их параллельно — загружаются одновременно. Быстрее в 3 раза.

**Q: Как работает динамический дропдаун игроков?**
A: При смене команды в goal-team срабатывает обработчик. Он берёт список игроков из currentMatch.team1_players или team2_players (данные пришли с сервером). Создаёт option элементы и добавляет в select.

**Q: Зачем encodeURIComponent?**
A: URL не может содержать символы &, ?, #, пробел и другие. encodeURIComponent превращает их в %XX коды. Без этого URL сломается или будет неправильно интерпретирован сервером.

**Q: Как матчи группируются по раундам?**
A: Создаём объект rounds = {}. Для каждого матча проверяем: есть ли уже rounds[match.round]? Если нет — создаём пустой массив. Добавляем матч в массив. Итого: ключи объекта = номера раундов, значения = массивы матчей.

**Q: Зачем sort((a, b) => a - b) для ключей раундов?**
A: Object.keys() возвращает строки. Строки сортируются лексикографически: '1', '10', '2'. Нам нужна числовая: '1', '2', '10'. Функция (a, b) => a - b — JavaScript преобразует строки в числа для вычитания.

**Q: Что происходит когда организатор завершает матч?**
A: API.updateMatchResult отправляет { status: 'finished' } на сервер. Бэкенд пересчитывает standings (очки, голы, разницу). Фронтенд закрывает модал и перезагружает всё: турниры, матчи, статистику.
