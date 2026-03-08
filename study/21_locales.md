# 📁 Папка: frontend/locales/

## Что это такое?
4 файла переводов для 4 языков:
- `en.js` — английский (главный, эталонный)
- `ru.js` — русский (полный перевод)
- `hy.js` — армянский (полный перевод, юникод)
- `ge.js` — грузинский (полный перевод, грузинский алфавит)

Каждый файл вызывает `I18n.registerTranslations(lang, obj)` и передаёт объект с переводами.

---

## СТРУКТУРА locale файла

```js
// en.js
I18n.registerTranslations('en', {
    common: { loading: 'Loading...', save: 'Save', ... },
    nav: { home: 'Home', tournaments: 'Tournaments', ... },
    hero: { title: 'Welcome to 11UNITY', ... },
    profile: { ... },
    auth: { ... },
    tournaments: { ... },
    fixturesSettings: { ... },
    match: { ... },
    teams: { ... },
    addPlayer: { ... },
    stats: { ... },
    matches: { ... },
    statistics: { ... },
    footer: { ... },
    messages: {
        success: { ... },
        error: { ... }
    },
    welcome: 'Welcome to 11UNITY!'
});
```

Всего **15 секций** переводов. Каждая секция — один раздел сайта.

---

## Как переводы используются в коде

```js
// Простой ключ:
I18n.t('common.loading')           // → 'Loading...' / 'Загрузка...'
I18n.t('nav.tournaments')          // → 'Tournaments' / 'Турниры'

// Вложенный ключ:
I18n.t('auth.roles.player')        // → 'Player' / 'Игрок'
I18n.t('messages.error.loginFailed') // → 'Login failed...' / 'Ошибка входа...'

// С параметром {num}:
I18n.t('tournaments.round', { num: 3 })
// en → 'Round 3'
// ru → 'Тур 3'

// С параметром {current}/{max}:
I18n.t('tournaments.teamsJoined', { current: 5, max: 8 })
// en → '5/8 teams'
// ru → '5/8 команд'
```

---

## Секция common — общие слова

```js
common: {
    loading: 'Loading...',    // индикатор загрузки
    save: 'Save',             // кнопка сохранения
    cancel: 'Cancel',         // кнопка отмены
    delete: 'Delete',         // кнопка удаления
    at: 'at',                 // "18:00 at May 15" → "18:00 в 15 мая"
    vs: 'VS',                 // между командами (VS одинаково везде)
    tbd: 'TBD',               // To Be Determined / Уточняется
}
```

**Интересная деталь — `at`:**
```js
// en: "May 15, 2026 at 18:00"
// ru: "15 мая 2026 в 18:00"
// hy: "15 Մայիս 2026 -ին 18:00"
```
Это маленькое слово "at/в/-ին" нужно переводить — поэтому оно в переводах.

---

## Секция stats — таблица турнира

```js
// en.js:
stats: {
    played: 'P',    // Played
    won: 'W',       // Won
    drawn: 'D',     // Drawn
    lost: 'L',      // Lost
    goalsFor: 'GF', // Goals For
    goalsAgainst: 'GA',
    goalDifference: 'GD',
    points: 'Pts'
}

// ru.js:
stats: {
    played: 'И',    // Игры
    won: 'В',       // Выигрыши
    drawn: 'Н',     // Ничьи
    lost: 'П',      // Поражения
    goalsFor: 'ЗМ', // Забитые мячи
    goalsAgainst: 'ПМ', // Пропущенные мячи
    goalDifference: 'РМ', // Разница мячей
    points: 'О'     // Очки
}
```

В русском футболе используются аббревиатуры: И В Н П ЗМ ПМ РМ О.
В английском: P W D L GF GA GD Pts.

---

## Секция messages — все сообщения

```js
messages: {
    success: {
        login: 'Successfully logged in!',
        tournamentCreated: 'Tournament created successfully!',
        fixturesGenerated: 'Fixtures generated successfully!',
        // ...
    },
    error: {
        loginFailed: 'Login failed. Please check your credentials.',
        unauthorized: 'Please login to continue.',
        onlyOrganizers: 'Only organizers can create tournaments',
        // ...
    }
}
```

**Все уведомления централизованы** — ни одна строка ошибки не захардкожена в JS коде.
Если нужно изменить текст ошибки — меняем только в locale файле, не в логике.

---

## Параметры в переводах: {num}, {count}, {current}

```js
// en.js:
tournaments: {
    round: 'Round {num}',          // → 'Round 3'
    teamsJoined: '{current}/{max} teams', // → '5/8 teams'
    teamsCount: '{count} teams',   // → '8 teams'
}

// ru.js:
tournaments: {
    round: 'Тур {num}',            // → 'Тур 3'
    teamsJoined: '{current}/{max} команд', // → '5/8 команд'
    teamsCount: '{count} команд',  // → '8 команд'
}
```

Как работает подстановка параметров (из i18n.js):
```js
value.replace(/\{(\w+)\}/g, (match, paramName) => {
    return params[paramName] !== undefined ? params[paramName] : match;
});
// '{current}/{max} teams' + {current:5, max:8}
// → '5/8 teams'
```

---

## Армянский (hy.js) — юникод

```js
// hy.js хранит армянский в \uXXXX юникод кодах:
common: {
    loading: '\u0532\u0565\u057c\u0576\u0578\u0582\u0574...',
    // Это: Բ + ե + ռ + ն + ո + ւ + մ = Բեռնում... (Загрузка...)
}
```

**Почему юникод коды?**
Некоторые редакторы или системы не всегда правильно отображают армянский алфавит.
Юникод коды (`\uXXXX`) — универсальны, работают везде.
Браузер преобразует их в символы автоматически.

**`\u0532`** — юникод escape-последовательность:
```
\u + 4 hex цифры = один символ Unicode
\u0532 = Բ (армянская буква "Б")
\u0565 = ե (армянская буква "е")
```

Грузинский (ge.js) написан прямо грузинскими буквами — `იანვარი` — так как файл сохранён в UTF-8.

---

## Порядок загрузки locale файлов

В `index.html`:
```html
<script src="js/i18n.js"></script>       <!-- сначала I18n объект -->
<script src="locales/en.js"></script>    <!-- потом регистрируем переводы -->
<script src="locales/ru.js"></script>
<script src="locales/hy.js"></script>
<script src="locales/ge.js"></script>
<script src="js/main.js"></script>       <!-- main.js после всех переводов -->
```

Если загрузить locale до i18n.js → `I18n.registerTranslations` не существует → ошибка!
Порядок важен.

---

## Что делать если ключ не переведён

```js
// В hy.js или ge.js может не быть ключа (заполнен английским)
// i18n.js автоматически делает fallback к английскому:

t(key) {
    let value = this.translations[this.currentLang];
    // ... ищем ключ

    if (value === undefined && this.currentLang !== 'en') {
        // Fallback к английскому
        value = this.translations['en'];
        // ... ищем снова
    }
}
```

Поэтому если в армянском файле нет нужного ключа — покажется английский текст.

---

## Сравнение переводов одной строки

| Ключ | en | ru | hy | ge |
|------|----|----|----|----|
| `nav.tournaments` | Tournaments | Турниры | Մրցաշարեր | ტურნირები |
| `common.loading` | Loading... | Загрузка... | Բեռնում... | იტვირთება... |
| `auth.roles.player` | Player | Игрок | Խաղացող | მოთამაშე |
| `stats.points` | Pts | О | Կ | ქ |
| `tournaments.round` | Round {num} | Тур {num} | Տուր {num} | ტური {num} |

---

## 🔑 Концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| Locale файл | JS файл с одним вызовом registerTranslations |
| Вложенная структура переводов | Секции: common, nav, auth, messages.error... |
| Параметры {key} в строках | Подставляются при вызове I18n.t('key', {param: value}) |
| `\uXXXX` юникод escape | Запись любого символа через его unicode код |
| Fallback к английскому | Если нет перевода → автоматически берётся en.js |
| Порядок загрузки | i18n.js → locales → main.js (строго!) |
| Централизация строк | Все тексты в одном месте, не разбросаны по JS файлам |

---

## ❓ Вопросы с защиты

**Q: Зачем отдельные файлы для каждого языка, а не один большой?**
A: Разделение ответственности. Каждый файл — один язык. Легко добавить новый язык — создать новый файл. Легко исправить перевод — открыть нужный файл. Один большой файл был бы сложнее читать.

**Q: Как работает I18n.t с вложенными ключами?**
A: Разбиваем строку по точке: 'messages.error.loginFailed' → ['messages', 'error', 'loginFailed']. Потом шаг за шагом идём по объекту: translations['ru'] → ['messages'] → ['error'] → ['loginFailed'] → получаем строку.

**Q: Что произойдёт если перевод не найден?**
A: Система работает в три уровня. Сначала ищет в текущем языке. Если нет — ищет в английском (fallback). Если и там нет — возвращает сам ключ ('messages.error.loginFailed') и пишет предупреждение в консоль.

**Q: Почему armenia (hy.js) написан в юникод кодах \uXXXX?**
A: Для надёжности. \uXXXX коды работают в любой системе независимо от кодировки файла. Грузинский написан обычными символами потому что файл сохранён в UTF-8 и редактор нормально с ним работает.

**Q: Зачем нужны параметры {num} в строках переводов?**
A: Динамические значения. 'Round {num}' при вызове с {num: 3} превратится в 'Round 3'. Это лучше чем конкатенация строк потому что в разных языках порядок слов разный. Например в русском 'Тур {num}' а не '{num} Тур'.
