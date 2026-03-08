# 📁 Файл: frontend/js/teams.js

## Что это такое?
Модуль управления командами — 987 строк.
Отвечает за: список команд, создание/редактирование/удаление, добавление/удаление игроков, поиск игроков.

---

## СТРУКТУРА объекта

```js
const Teams = {
    teams: [],          // массив всех загруженных команд
    currentTeamId: null // id команды открытой в модале
};
```

---

## ФУНКЦИЯ: init()

```js
init() {
    this.createModals();         // создать 4 модала
    this.attachEventListeners(); // навесить обработчики
    this.load();                 // загрузить команды

    window.addEventListener('languageChanged', () => {
        I18n.applyTranslations();
        this.render();  // перерисовать карточки на новом языке
    });
},
```

Модалы которые создаются:
1. `create-team-modal` — форма создания
2. `edit-team-modal` — форма редактирования
3. `team-details-modal` — детали команды + список игроков
4. `add-player-modal` — поиск и добавление игрока

---

## ФУНКЦИЯ: updateLogoPreview() — живой предпросмотр логотипа

```js
updateLogoPreview() {
    const name = document.getElementById('team-name').value.trim();
    const color = document.getElementById('team-color').value;
    const preview = document.getElementById('team-logo-preview');

    preview.textContent = name.length >= 2
        ? name.replace(/\s+/g, '').substring(0, 3).toUpperCase()
        : '--';
    preview.style.background = color;
},
```

Вызывается при каждом нажатии клавиши (`addEventListener('input', ...)`).
Пример: `"FC Barcelona"` → убрать пробелы → `"FCBarcelona"` → первые 3 → `"FCB"` → UPPER → `"FCB"`.

**`/\s+/g`** — регулярное выражение:
- `\s` — любой пробельный символ (пробел, таб, перевод строки)
- `+` — один или более
- `g` — глобально (заменить все)
```js
'FC Barcelona United'.replace(/\s+/g, '')  // → 'FCBarcelonaUnited'
```

**`input type="color"`** — нативный HTML выбор цвета (color picker браузера):
```html
<input type="color" value="#2ecc71">
```
`.value` возвращает HEX цвет: `'#2ecc71'`.

---

## ФУНКЦИЯ: handleTeamButton() — умная кнопка тренера

```js
handleTeamButton() {
    if (!API.isAuthenticated()) { ... }

    const user = API.getUser();
    if (user.role !== 'coach') { ... }

    // Найти команду этого тренера
    const myTeam = this.teams.find(t => t.coach_id === user.id);

    if (myTeam) {
        this.openDetailsModal(myTeam);  // открыть "Моя команда"
    } else {
        this.openCreateModal();          // создать команду
    }
},
```

**`array.find(fn)`** — найти первый элемент удовлетворяющий условию:
```js
[{id:1, role:'player'}, {id:2, role:'coach'}].find(u => u.role === 'coach')
// → {id:2, role:'coach'}
// Если не найдено → undefined
```

Одна кнопка с двойной функцией:
- Нет команды → "Create Team" → открыть форму создания
- Есть команда → "My Team" → открыть детали

---

## ФУНКЦИЯ: updateStats() — счётчики через reduce

```js
updateStats() {
    const total = this.teams.length;
    const totalPlayers = this.teams.reduce(
        (sum, team) => sum + parseInt(team.players_count || 0),
        0
    );
    document.getElementById('total-teams').textContent = total;
    document.getElementById('total-players').textContent = totalPlayers;
},
```

**`array.reduce(fn, initialValue)`** — свести массив к одному значению:
```js
// Сумма players_count всех команд:
[{players_count: 5}, {players_count: 8}, {players_count: 3}]
.reduce((sum, team) => sum + parseInt(team.players_count), 0)
// Шаг 1: sum=0, team={5} → 0+5 = 5
// Шаг 2: sum=5, team={8} → 5+8 = 13
// Шаг 3: sum=13, team={3} → 13+3 = 16
// Результат: 16
```

---

## ФУНКЦИЯ: openDetailsModal() — открыть детали команды

```js
async openDetailsModal(team) {
    this.currentTeamId = team.id;

    const response = await API.getTeamById(team.id);
    const fullTeam = response.team;  // полные данные с сервера (со статистикой и игроками)

    // Заполнить поля
    document.getElementById('modal-team-name').textContent = fullTeam.name;
    const logo = document.getElementById('modal-team-logo');
    logo.textContent = fullTeam.logo || fullTeam.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    logo.style.background = fullTeam.logo_color || '#2ecc71';

    // Статистика команды
    const stats = fullTeam.stats || {};
    document.getElementById('modal-team-stat-matches').textContent = stats.total_matches || 0;
    document.getElementById('modal-team-stat-wins').textContent = stats.total_wins || 0;

    // Права: тренер может добавлять игроков ТОЛЬКО если турнир не active
    const isCoach = user && user.role === 'coach' && fullTeam.coach_id === user.id;
    const isInActiveTournament = fullTeam.tournament_status === 'active';

    addPlayerBtn.style.display = (isCoach && !isInActiveTournament) ? 'inline-flex' : 'none';

    // Кнопка Delete: только если 0 игроков И не в турнире
    deleteTeamBtn.style.display =
        (isCoach && players.length === 0 && !fullTeam.tournament_id)
        ? 'inline-flex' : 'none';

    this.renderPlayersList(players, isCoach && !isInActiveTournament, team.id);
},
```

**Зачем загружать fullTeam заново с сервера?**
Список команд (`this.teams`) содержит только краткие данные (id, name, players_count).
Для деталей нужно больше: статистика, список игроков, статус турнира.

**Условие удаления команды:**
```
Можно удалить ТОЛЬКО если:
1. Ты тренер этой команды (isCoach)
2. В команде 0 игроков (players.length === 0)
3. Команда не участвует в турнире (!fullTeam.tournament_id)
```

---

## ФУНКЦИЯ: renderPlayersList() — список игроков

```js
renderPlayersList(players, canRemove, teamId) {
    container.innerHTML = players.length === 0
        ? `<div class="empty-state">...</div>`
        : `
            <div style="display: grid; gap: 8px;">
                ${players.map(player => `
                    <div style="...">
                        <div style="...">${player.jersey_number}</div>
                        <div>${player.player_name}</div>
                        <span>${player.position}</span>

                        ${canRemove ? `
                            <button onclick="Teams.handleRemovePlayer(${teamId}, ${player.player_id})">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
},
```

**`canRemove`** — булев параметр: показывать ли кнопку удаления.
Передаётся как `isCoach && !isInActiveTournament` — только тренер и только если турнир не active.

**`onclick="Teams.handleRemovePlayer(...)"` в HTML строке:**
```js
// Вставляем прямо в строку template literal:
`<button onclick="Teams.handleRemovePlayer(${teamId}, ${player.player_id})">`
// Результат в HTML:
// <button onclick="Teams.handleRemovePlayer(5, 23)">
```
Функция доступна глобально через `window.Teams = Teams` (в конце файла нет, но Teams — глобальная const).

---

## ФУНКЦИЯ: searchPlayers() — поиск игроков по запросу

```js
async searchPlayers() {
    const query = document.getElementById('search-player-query').value.trim();

    if (query.length < 2) {
        UI.showNotification('Enter at least 2 characters', 'error');
        return;
    }

    const response = await API.request(
        `/teams/${this.currentTeamId}/players/search?query=${encodeURIComponent(query)}`
    );
    const players = response.players || [];

    playersList.innerHTML = players.map(player => `
        <div style="...">
            <div>${player.name}</div>
            <div>${player.email}</div>
            ${player.has_team
                ? `<div style="color:red;">Already in a team</div>`
                : ''
            }
            <button
                onclick='Teams.selectPlayer(${JSON.stringify(player).replace(/'/g, "\\'")})'
                ${player.has_team ? 'disabled' : ''}
            >Select</button>
        </div>
    `).join('');
},
```

**`JSON.stringify(player).replace(/'/g, "\\'")`:**
```js
// Передать объект через onclick атрибут:
const player = { id: 5, name: "O'Brien" };

// Проблема: одинарные кавычки в имени сломают атрибут onclick='...'
JSON.stringify(player)  // → '{"id":5,"name":"O\'Brien"}'
.replace(/'/g, "\\'")   // экранировать одиночные кавычки
```
Это позволяет передать весь объект игрока в onclick строке.

**`player.has_team`** — сервер возвращает флаг: игрок уже в команде?
Если да — кнопка `disabled`, показываем предупреждение.

---

## ФУНКЦИЯ: selectPlayer() — выбрать игрока из результатов поиска

```js
selectPlayer(player) {
    document.getElementById('selected-player-id').value = player.id;
    document.getElementById('selected-player-name').textContent = player.name;
    document.getElementById('selected-player-email').textContent = player.email;

    document.getElementById('add-player-form-container').style.display = 'block';
    document.getElementById('player-jersey').focus();  // сфокусировать на номере
},
```

**`element.focus()`** — переместить фокус на элемент (пользователь сразу может печатать):
```js
input.focus()  // курсор окажется в этом поле
```

**`input type="hidden"`** — скрытое поле формы, хранит id выбранного игрока:
```html
<input type="hidden" id="selected-player-id">
```
Пользователь не видит, но значение отправляется с формой.

---

## ФУНКЦИЯ: rgbToHex() — конвертация цвета

```js
rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;  // уже hex → вернуть

    const match = rgb.match(/\d+/g);  // найти все числа
    // 'rgb(46, 204, 113)' → ['46', '204', '113']

    return '#' + match.slice(0, 3)
        .map(x => parseInt(x).toString(16).padStart(2, '0'))
        .join('');
    // 46 → '2e', 204 → 'cc', 113 → '71' → '#2ecc71'
},
```

**Зачем это нужно?**
`element.style.background` может вернуть `'rgb(46, 204, 113)'` (браузер так хранит).
Но `<input type="color">` требует HEX формат `'#2ecc71'`.
Конвертируем обратно в hex.

**`.toString(16)`** — число в 16-ричную систему:
```js
46..toString(16)   // → '2e'
204..toString(16)  // → 'cc'
113..toString(16)  // → '71'
```

**`.padStart(2, '0')`** — дополнить нулями до 2 символов:
```js
'e'.padStart(2, '0')  // → '0e' (для числа 14)
'2e'.padStart(2, '0') // → '2e' (уже 2 символа)
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `array.find(fn)` | Найти первый элемент по условию |
| `array.reduce(fn, init)` | Свести массив к одному значению (сумма) |
| `/\s+/g` регулярное выражение | Убрать все пробелы из строки |
| `input type="color"` | Нативный color picker браузера |
| `input type="hidden"` | Скрытое поле для хранения id |
| `element.focus()` | Переместить курсор в элемент |
| `JSON.stringify(obj)` в onclick | Передать объект через HTML атрибут |
| `.toString(16)` | Число → 16-ричная строка |
| `.padStart(2, '0')` | Дополнить строку нулями до N символов |
| `.match(/\d+/g)` | Найти все числа в строке |
| `addEventListener('input', fn)` | Событие при каждом изменении поля |

---

## ❓ Вопросы с защиты

**Q: Зачем одна кнопка выполняет две функции (Create Team / My Team)?**
A: UX решение. Тренер видит одну кнопку. Если команды нет — кнопка открывает создание. Если есть — открывает свою команду. Меняем только текст и поведение кнопки через updateTeamButton(). Не нужно показывать/скрывать разные кнопки.

**Q: Почему нельзя удалить команду с игроками или в турнире?**
A: Целостность данных. Если команда в турнире — удаление сломает расписание матчей. Если есть игроки — они потеряют принадлежность к команде. Проверяем два условия: players.length === 0 и !fullTeam.tournament_id.

**Q: Зачем загружать полные данные команды при открытии модала?**
A: Список команд хранит только краткие данные (имя, количество игроков). Для деталей нужно больше: полный список игроков (имя, позиция, номер), статистика (победы, голы), статус турнира. Делаем отдельный запрос API.getTeamById().

**Q: Как работает поиск игроков?**
A: Вводим минимум 2 символа → запрос к /teams/:id/players/search?query=... → сервер ищет пользователей с ролью player по имени/email → возвращает список с флагом has_team → показываем результаты, заблокировав уже занятых.

**Q: Что такое array.reduce и как считается сумма игроков?**
A: reduce — аккумулятор. Начинаем с 0. Для каждой команды добавляем её players_count к накопленной сумме. После перебора всех команд получаем общее число игроков на платформе.

**Q: Зачем rgbToHex?**
A: Браузер хранит цвет в CSS как rgb(46, 204, 113). Но input type="color" требует hex формат #2ecc71. Конвертируем: разбиваем строку, каждое число переводим в 16-ричное, соединяем с #.
