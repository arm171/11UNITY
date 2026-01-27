// ============================================
// RUSSIAN TRANSLATIONS
// ============================================

I18n.registerTranslations('ru', {
    // Common
    common: {
        loading: 'Загрузка...',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        create: 'Создать',
        search: 'Поиск',
        close: 'Закрыть',
        yes: 'Да',
        no: 'Нет',
        at: 'в',
        vs: 'VS',
        tbd: 'Уточняется',
        unknown: 'Неизвестно',
        noDescription: 'Описание отсутствует.',
        confirmLogout: 'Вы уверены, что хотите выйти?',
        optional: 'необязательно'
    },

    // Navigation
    nav: {
        home: 'Главная',
        tournaments: 'Турниры',
        teams: 'Команды',
        matches: 'Матчи',
        statistics: 'Статистика',
        getStarted: 'Начать'
    },

    // Hero section
    hero: {
        title: 'Добро пожаловать в 11UNITY',
        subtitle: 'Лучшая платформа для управления футбольными турнирами. Создавайте команды, организуйте турниры, отслеживайте матчи и анализируйте статистику.',
        cta: 'Начать турнир'
    },

    // Profile
    profile: {
        title: 'Профиль',
        language: 'Язык',
        memberSince: 'На сайте с'
    },

    // Auth
    auth: {
        login: 'Вход',
        register: 'Регистрация',
        logout: 'Выход',
        email: 'Email',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        fullName: 'Полное имя',
        role: 'Роль',
        selectRole: 'Выберите роль',
        createAccount: 'Создать аккаунт',
        emailPlaceholder: 'your@email.com',
        passwordPlaceholder: '........',
        namePlaceholder: 'Иван Иванов',
        passwordsDoNotMatch: 'Пароли не совпадают!',
        roles: {
            player: 'Игрок',
            coach: 'Тренер',
            organizer: 'Организатор'
        }
    },

    // Tournaments
    tournaments: {
        title: 'Турниры',
        total: 'Всего',
        active: 'Активные',
        finished: 'Завершенные',
        upcoming: 'Предстоящие',
        createTournament: 'Создать турнир',
        noTournaments: 'Турниров пока нет',
        beFirst: 'Будьте первым, кто создаст турнир!',
        tournamentName: 'Название турнира',
        tournamentNamePlaceholder: 'Лига Чемпионов 2024',
        type: 'Тип',
        selectType: 'Выберите тип',
        types: {
            league: 'Лига (Все против всех)',
            playoff: 'Плей-офф (На вылет)',
            group_playoff: 'Группа + Плей-офф'
        },
        startDate: 'Дата начала',
        endDate: 'Дата окончания',
        location: 'Место проведения',
        locationPlaceholder: 'Город, Стадион',
        maxTeams: 'Максимум команд',
        teamsCount: '{count} команд',
        description: 'Описание',
        descriptionPlaceholder: 'Детали турнира...',
        joinTournament: 'Присоединиться',
        generateFixtures: 'Создать расписание',
        standings: 'Таблица',
        statistics: 'Статистика',
        fixtures: 'Расписание',
        noStandings: 'Таблица пуста',
        standingsSubtitle: 'Таблица появится после проведения матчей',
        noStatistics: 'Статистика пуста',
        statisticsSubtitle: 'Статистика игроков появится после событий в матчах',
        noFixtures: 'Расписание пусто',
        fixturesSubtitle: 'Создайте расписание, чтобы увидеть матчи!',
        teamParticipating: 'Ваша команда участвует в этом турнире',
        needTeamFirst: 'Сначала нужно создать команду',
        tournamentFull: 'Турнир заполнен',
        joinSuccess: 'Вы успешно присоединились к турниру!',
        round: 'Тур {num}',
        teamsJoined: '{current}/{max} команд'
    },

    // Fixtures settings
    fixturesSettings: {
        title: 'Настройки расписания',
        matchTime: 'Время матча',
        matchDays: 'Дни матчей',
        matchesPerDay: 'Матчей в день',
        matchCount: '{count} матч',
        matchesCount: '{count} матчей',
        venue: 'Стадион',
        venuePlaceholder: 'Название стадиона',
        generate: 'Создать',
        selectAtLeastOneDay: 'Выберите хотя бы один день',
        days: {
            mon: 'Пн',
            tue: 'Вт',
            wed: 'Ср',
            thu: 'Чт',
            fri: 'Пт',
            sat: 'Сб',
            sun: 'Вс'
        }
    },

    // Match
    match: {
        enterResults: 'Ввести результаты матча',
        finalScore: 'Финальный счет',
        homeScore: 'Голы хозяев',
        awayScore: 'Голы гостей',
        updateScore: 'Обновить счет',
        addGoal: 'Добавить гол',
        addCard: 'Добавить карточку',
        team: 'Команда',
        selectTeam: 'Выберите команду',
        homeTeam: 'Хозяева',
        awayTeam: 'Гости',
        playerEmail: 'Игрок (email)',
        playerEmailPlaceholder: 'player@example.com',
        minute: 'Минута',
        assist: 'Ассист (необязательно - email)',
        assistPlaceholder: 'assistant@example.com',
        cardType: 'Тип карточки',
        selectCardType: 'Выберите тип',
        yellowCard: 'Желтая карточка',
        redCard: 'Красная карточка',
        matchEvents: 'События матча',
        noEvents: 'Событий пока нет',
        goal: 'Гол',
        card: 'Карточка',
        scoreUpdated: 'Счет обновлен!',
        goalAdded: 'Гол добавлен!',
        cardAdded: 'Карточка добавлена!'
    },

    // Teams
    teams: {
        title: 'Команды',
        totalTeams: 'Всего команд',
        players: 'Игроки',
        coaches: 'Тренеры',
        createTeam: 'Создать команду',
        noTeams: 'Команд пока нет',
        createTeamCta: 'Создайте команду и начните играть!',
        teamName: 'Название команды',
        teamNamePlaceholder: 'ФК Барселона',
        logo: 'Логотип (2-3 буквы)',
        logoPlaceholder: 'ФКБ',
        logoColor: 'Цвет логотипа',
        stadium: 'Стадион',
        stadiumPlaceholder: 'Камп Ноу',
        maxPlayers: 'Максимум игроков',
        playersCount: '{count} игроков',
        coach: 'Тренер',
        notSpecified: 'Не указано',
        noDescriptionProvided: 'Описание не указано',
        teamPlayers: 'Игроки команды',
        addPlayer: 'Добавить игрока',
        noPlayers: 'Игроков пока нет',
        addPlayersCta: 'Добавьте игроков в команду!',
        matches: 'Матчи',
        wins: 'Победы',
        draws: 'Ничьи',
        losses: 'Поражения',
        playerCount: '{count}/{max}'
    },

    // Add player modal
    addPlayer: {
        title: 'Добавить игрока',
        searchByEmail: 'Поиск игрока по Email',
        emailPlaceholder: 'player@email.com',
        search: 'Поиск',
        searchPlaceholder: 'player@email.com',
        searchResults: 'Результаты поиска:',
        noPlayersFound: 'Игроки с email "{email}" не найдены',
        alreadyInTeam: 'Уже в команде',
        select: 'Выбрать',
        playerDetails: 'Данные игрока:',
        jerseyNumber: 'Номер (1-99)',
        jerseyPlaceholder: '10',
        position: 'Позиция',
        selectPosition: 'Выберите позицию',
        positions: {
            goalkeeper: 'Вратарь',
            defender: 'Защитник',
            midfielder: 'Полузащитник',
            forward: 'Нападающий'
        },
        addToTeam: 'Добавить в команду',
        playerAdded: 'Игрок добавлен!',
        removePlayer: 'Удалить игрока',
        confirmRemove: 'Вы уверены, что хотите удалить этого игрока из команды?',
        playerRemoved: 'Игрок удален!'
    },

    // Statistics table headers
    stats: {
        rank: '#',
        team: 'Команда',
        played: 'И',
        won: 'В',
        drawn: 'Н',
        lost: 'П',
        goalsFor: 'ЗМ',
        goalsAgainst: 'ПМ',
        goalDifference: 'РМ',
        points: 'О',
        player: 'Игрок',
        goals: 'Голы',
        cards: 'Карточки',
        topScorers: 'Лучшие бомбардиры',
        noGoalsScored: 'Голов пока нет',
        yellowCards: 'Желтые карточки',
        noYellowCards: 'Желтых карточек пока нет',
        redCards: 'Красные карточки',
        noRedCards: 'Красных карточек пока нет'
    },

    // Sections coming soon
    comingSoon: {
        title: 'Скоро',
        matchesSubtitle: 'Календарь матчей скоро будет доступен!',
        statisticsSubtitle: 'Статистика будет доступна после проведения матчей!'
    },

    // Messages
    messages: {
        success: {
            login: 'Вы успешно вошли!',
            register: 'Аккаунт успешно создан!',
            tournamentCreated: 'Турнир успешно создан!',
            teamCreated: 'Команда успешно создана!',
            logout: 'Вы вышли из системы!',
            fixturesGenerated: 'Расписание успешно создано!'
        },
        error: {
            loginFailed: 'Ошибка входа. Проверьте данные.',
            registerFailed: 'Ошибка регистрации. Попробуйте снова.',
            loadTournaments: 'Не удалось загрузить турниры.',
            loadTeams: 'Не удалось загрузить команды.',
            createTournament: 'Не удалось создать турнир.',
            createTeam: 'Не удалось создать команду.',
            unauthorized: 'Пожалуйста, войдите в систему.',
            networkError: 'Ошибка сети. Проверьте подключение.',
            onlyOrganizers: 'Только организаторы могут создавать турниры',
            onlyCoaches: 'Только тренеры могут создавать команды',
            joinFailed: 'Не удалось присоединиться к турниру',
            generateFixturesFailed: 'Не удалось создать расписание',
            loadMatchDetails: 'Не удалось загрузить данные матча',
            updateScoreFailed: 'Не удалось обновить счет',
            addGoalFailed: 'Не удалось добавить гол',
            addCardFailed: 'Не удалось добавить карточку',
            allFieldsRequired: 'Все поля обязательны',
            teamAndPlayerRequired: 'Укажите команду и игрока',
            enterEmail: 'Введите email для поиска',
            searchFailed: 'Ошибка поиска игроков',
            addPlayerFailed: 'Не удалось добавить игрока',
            removePlayerFailed: 'Не удалось удалить игрока',
            loadPlayersFailed: 'Не удалось загрузить игроков'
        }
    },

    // Welcome
    welcome: 'Добро пожаловать в 11UNITY!'
});
