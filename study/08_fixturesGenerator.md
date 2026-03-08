# 📁 Файл: backend/helpers/fixturesGenerator.js

## Что это такое?
Этот файл — алгоритм генерации расписания матчей турнира.
Когда организатор нажимает "Сгенерировать матчи" — этот файл решает КТО с КЕМ и КОГДА играет.

Использует алгоритм **Round-Robin** — каждая команда играет против каждой другой команды.
В нашем случае Double Round-Robin — каждая пара играет ДВАЖДЫ (дома и в гостях).

---

## Пример Round-Robin для 4 команд (A, B, C, D):

**Первый круг (home):**
```
Тур 1: A vs B,  C vs D
Тур 2: A vs C,  B vs D  (не B vs C — алгоритм следит чтобы не повторялось)
Тур 3: A vs D,  B vs C
```

**Второй круг (away) — всё наоборот:**
```
Тур 4: B vs A,  D vs C
Тур 5: C vs A,  D vs B
Тур 6: D vs A,  C vs B
```

Итого: 4 команды × 3 тура × 2 круга = 12 матчей
Формула: n × (n-1) матчей, где n = количество команд

---

## ФУНКЦИЯ 1: generateRoundRobinDouble — двойной круг

```js
function generateRoundRobinDouble(teams) {
    // Первый круг — обычный
    const firstLegRounds = generateSingleRound(teams);

    // Второй круг — меняем местами teamA и teamB
    const secondLegRounds = firstLegRounds.map(round => {
        return round.map(match => ({
            teamA: match.teamB,  // было: A vs B
            teamB: match.teamA   // стало: B vs A
        }));
    });

    // Соединяем оба круга в один массив
    return [...firstLegRounds, ...secondLegRounds];
}
```

**Spread оператор `...`:**
```js
[...firstLegRounds, ...secondLegRounds]
// Разворачивает массивы и соединяет:
// [round1, round2, round3] + [round4, round5, round6]
// = [round1, round2, round3, round4, round5, round6]
```

**`.map(fn)`** — создать новый массив, преобразовав каждый элемент.
Не изменяет исходный массив, возвращает новый!
```js
[1, 2, 3].map(x => x * 2)  // → [2, 4, 6]
```

---

## ФУНКЦИЯ 2: generateSingleRound — один круг (алгоритм)

```js
function generateSingleRound(teams) {
    let teamList = [...teams];  // копия массива (не изменяем оригинал)

    // Если нечётное количество команд — добавляем "пустышку" BYE
    if (n % 2 !== 0) {
        teamList.push({ id: null, name: 'BYE' });
    }
    // BYE нужен чтобы алгоритм работал с чётными числами
    // Матчи против BYE пропускаются (команда "отдыхает")

    const totalRounds = totalTeams - 1;    // туров всегда на 1 меньше чем команд
    const matchesPerRound = totalTeams / 2; // в каждом туре половина команд играет

    for (let round = 0; round < totalRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            // Математика алгоритма Round-Robin:
            const home = (round + match) % (totalTeams - 1);
            const away = (totalTeams - 1 - match + round) % (totalTeams - 1);

            // Последняя команда всегда фиксирована (ключ алгоритма)
            const homeTeam = match === 0 ? teamList[totalTeams - 1] : teamList[home];
            const awayTeam = teamList[away];

            // Матчи с BYE пропускаем
            if (homeTeam.id !== null && awayTeam.id !== null) {
                roundMatches.push({ teamA: homeTeam, teamB: awayTeam });
            }
        }
    }
}
```

**`%` — остаток от деления (modulo):**
```js
5 % 3 = 2   // 5 / 3 = 1 остаток 2
7 % 4 = 3
4 % 4 = 0
```
Используется чтобы индексы "закручивались по кругу" — когда доходят до конца, возвращаются к началу.

**Почему последняя команда фиксирована?**
Это классический трюк алгоритма Round-Robin.
Одна команда стоит на месте, остальные "вращаются" вокруг неё как часовая стрелка.
Это гарантирует что каждая пара встретится ровно один раз.

**`n % 2 !== 0`** — проверка на нечётное число.
- `4 % 2 = 0` → чётное
- `5 % 2 = 1` → нечётное (1 !== 0 → true)

---

## ФУНКЦИЯ 3: scheduleMatches — расставить даты

```js
function scheduleMatches(rounds, settings) {
    const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds } = settings;

    let currentDate = new Date(startDate);
    let roundNumber = 1;

    for (const round of rounds) {
        let matchesScheduledInRound = 0;

        for (const match of round) {
            // Найти следующий разрешённый день недели
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);  // +1 день
            }

            scheduledMatches.push({
                round: roundNumber,
                teamAId: match.teamA.id,
                teamBId: match.teamB.id,
                matchDate: formatDateTime(currentDate, matchTime)
            });

            matchesScheduledInRound++;

            // Если в день лимит матчей исчерпан — переходим на следующий разрешённый день
            if (matchesScheduledInRound % matchesPerDay === 0) {
                do {
                    currentDate.setDate(currentDate.getDate() + 1);
                } while (!matchDays.includes(currentDate.getDay()));
            }
        }

        // Тур закончился — следующий день обязательно
        currentDate.setDate(currentDate.getDate() + 1);

        // Дополнительные дни отдыха между турами
        if (daysBetweenRounds > 0) {
            currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
        }

        roundNumber++;
    }
}
```

**`currentDate.getDay()`** — возвращает день недели как число:
```
0 = Воскресенье
1 = Понедельник
2 = Вторник
3 = Среда
4 = Четверг
5 = Пятница
6 = Суббота
```
Если matchDays = [6, 0] → матчи только по выходным.

**`currentDate.setDate(currentDate.getDate() + 1)`** — добавить один день:
- `.getDate()` → текущий день месяца (число)
- `.setDate(x)` → установить день месяца
- Автоматически переходит на следующий месяц если нужно

**`while` и `do...while` — циклы:**
```js
// while: проверяет ПЕРЕД выполнением
while (условие) {
    // выполняется пока условие true
}

// do...while: выполняет ХОТЯ БЫ РАЗ, потом проверяет
do {
    // выполняется сначала, потом проверяется условие
} while (условие);
```

---

## ФУНКЦИЯ 4: formatDateTime — форматирование даты

```js
function formatDateTime(date, time) {
    const year = date.getFullYear();                           // 2026
    const month = String(date.getMonth() + 1).padStart(2, '0'); // "05"
    const day = String(date.getDate()).padStart(2, '0');         // "01"

    return `${year}-${month}-${day} ${time}:00`;
    // → "2026-05-01 18:00:00"
}
```

**`.getMonth() + 1`** — месяцы в JS считаются с 0!
- 0 = Январь, 1 = Февраль, ..., 11 = Декабрь
- Поэтому +1 чтобы получить привычные числа

**`.padStart(2, '0')`** — дополнить строку слева до нужной длины:
```js
String(5).padStart(2, '0')   // → "05"
String(12).padStart(2, '0')  // → "12" (уже 2 символа — не меняется)
String(1).padStart(3, '0')   // → "001"
```
Нужно чтобы MySQL принял формат: "2026-05-01", не "2026-5-1".

---

## ФУНКЦИЯ 5: calculateEndDate — вычислить дату окончания

Работает точно так же как scheduleMatches, но не сохраняет матчи — просто идёт по датам и в конце возвращает последнюю дату.

```js
return currentDate.toISOString().split('T')[0];
// toISOString() → "2026-08-15T00:00:00.000Z"
// split('T') → ["2026-08-15", "00:00:00.000Z"]
// [0] → "2026-08-15"
```

---

## 🔑 JS концепции изученные в этом уроке

| Концепция | Объяснение |
|-----------|------------|
| `function` вместо `const =>`  | Обычная функция (не стрелочная). Оба варианта работают |
| `[...array]` | Spread: скопировать массив |
| `[...arr1, ...arr2]` | Spread: соединить два массива |
| `array.map(fn)` | Создать новый массив с преобразованными элементами |
| `x % y` | Остаток от деления (modulo) |
| `while (условие) {}` | Цикл пока условие true |
| `do {} while (условие)` | Цикл: сначала выполни, потом проверь |
| `date.getDay()` | День недели (0=Вс, 1=Пн, ..., 6=Сб) |
| `date.getDate()` | День месяца (1-31) |
| `date.setDate(x)` | Установить день месяца |
| `date.getMonth() + 1` | Месяц (в JS с 0, поэтому +1) |
| `.padStart(n, '0')` | Дополнить строку нулями слева |
| `.toISOString()` | Дату в строку ISO формата |
| `.split('T')[0]` | Разбить строку по 'T', взять первую часть |

---

## 📊 Полная схема работы генератора

```
Вход: [TeamA, TeamB, TeamC, TeamD] + настройки

generateSingleRound([A,B,C,D])
    → [[A-B, C-D], [A-C, B-D], [A-D, B-C]]  ← 3 тура первого круга

generateRoundRobinDouble()
    → добавляет второй круг (наоборот)
    → [[A-B, C-D], ..., [B-A, D-C], ...]     ← 6 туров

scheduleMatches(rounds, settings)
    → {round:1, teamAId:1, teamBId:2, matchDate:"2026-05-03 18:00:00"}
    → {round:1, teamAId:3, teamBId:4, matchDate:"2026-05-03 18:00:00"}
    → {round:2, teamAId:1, teamBId:3, matchDate:"2026-05-10 18:00:00"}
    → ...

Выход: массив из 12 матчей с датами
```

---

## ❓ Вопросы с защиты

**Q: Что такое Round-Robin алгоритм?**
A: Алгоритм где каждая команда играет против каждой другой ровно один раз (single) или дважды (double). У нас double — каждая пара играет дома и в гостях.

**Q: Что делать если команд нечётное число?**
A: Добавляем виртуальную команду BYE. Команда которой попадается BYE в туре — "отдыхает", этот матч просто пропускается. Алгоритм работает только с чётным числом.

**Q: Почему последняя команда "фиксирована" в алгоритме?**
A: Это математический трюк Round-Robin. Одна команда стоит неподвижно, остальные по одной вращаются вокруг неё. Это гарантирует что каждая пара встретится ровно один раз без повторений.

**Q: Как работает matchDays?**
A: Массив разрешённых дней недели [0-6]. Например [6,0] = только суббота и воскресенье. Алгоритм пропускает запрещённые дни — прибавляет +1 день пока не найдёт разрешённый.

**Q: Почему getMonth() + 1?**
A: В JavaScript месяцы считаются с нуля: 0=январь, 11=декабрь. Исторически так сложилось. Прибавляем +1 чтобы получить привычные числа 1-12.

**Q: Зачем padStart?**
A: MySQL требует формат YYYY-MM-DD HH:mm:ss. Без padStart: "2026-5-1" — MySQL не примет. С padStart: "2026-05-01" — правильный формат.
