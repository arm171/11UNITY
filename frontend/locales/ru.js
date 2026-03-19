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
        profile: 'Профиль',
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
        memberSince: 'На сайте с',
        dashboard: 'Панель',
        myTeam: 'Моя команда',
        myTournament: 'Мой турнир',
        myTournaments: 'Мои турниры',
        noTeam: 'Команды пока нет',
        noTournament: 'Нет активного турнира',
        tournamentsCreated: 'Турниров создано',
        activeTournaments: 'Активных турниров',
        totalTournaments: 'Всего',
        personalStats: 'Личная статистика',
        teamOverview: 'Обзор команды',
        teamRecord: 'Результаты команды',
        roster: 'Состав',
        recentMatches: 'Последние матчи',
        position: 'Позиция',
        jersey: 'Номер',
        goals: 'Голы',
        assists: 'Передачи',
        yellowCards: 'Жёлтые карточки',
        redCards: 'Красные карточки',
        matches: 'Матчи',
        wins: 'Победы',
        draws: 'Ничьи',
        losses: 'Поражения',
        goalsFor: 'Голы забитые',
        goalsAgainst: 'Голы пропущенные',
        editProfile: 'Редактировать профиль',
        changePasswordHint: 'Оставьте поля пароля пустыми, чтобы сохранить текущий',
        currentPassword: 'Текущий пароль',
        newPassword: 'Новый пароль',
        currentPasswordRequired: 'Введите текущий пароль для его изменения',
        systemOverview: 'Обзор системы',
        leaveTeam: 'Покинуть команду',
        confirmLeaveTeam: 'Вы уверены, что хотите покинуть команду?',
        leftTeam: 'Вы покинули команду'
    },

    // Admin
    admin: {
        users: 'Пользователи'
    },

    // Auth
    auth: {
        login: 'Вход',
        register: 'Регистрация',
        logout: 'Выход',
        email: 'Email',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        name: 'Имя',
        fullName: 'Полное имя',
        role: 'Роль',
        selectRole: 'Выберите роль',
        createAccount: 'Создать аккаунт',
        emailPlaceholder: 'your@email.com',
        passwordPlaceholder: '........',
        namePlaceholder: 'Генрих Мхитарян',
        passwordsDoNotMatch: 'Пароли не совпадают!',
        forgotPassword: 'Забыли пароль?',
        checkEmail: 'Проверьте почту!',
        resetSentTo: 'Мы отправили ссылку для сброса на',
        clickLinkToReset: 'Нажмите на ссылку в письме, чтобы задать новый пароль.',
        openEmail: 'Открыть почту',
        forgotPasswordHint: 'Введите ваш email и мы отправим ссылку для сброса.',
        sendResetLink: 'Отправить ссылку',
        resetLinkSent: 'Ссылка отправлена! Проверьте почту.',
        newPassword: 'Новый пароль',
        newPasswordHint: 'Введите новый пароль.',
        saveNewPassword: 'Сохранить пароль',
        passwordResetSuccess: 'Пароль успешно сброшен! Теперь вы можете войти.',
        roles: {
            player: 'Игрок',
            coach: 'Тренер',
            organizer: 'Организатор',
            admin: 'Администратор'
        }
    },

    // Tournaments
    tournaments: {
        title: 'Турниры',
        total: 'Всего',
        active: 'Активные',
        finished: 'Завершённые',
        upcoming: 'Предстоящие',
        createTournament: 'Создать турнир',
        noTournaments: 'Турниров пока нет',
        beFirst: 'Будьте первым, кто создаст турнир!',
        tournamentName: 'Название турнира',
        tournamentNamePlaceholder: 'Лига Чемпионов 2026',
        category: 'Категория',
        selectCategory: 'Выберите категорию',
        categories: {
            school: 'Школьный',
            university: 'Университетский',
            amateur: 'Любительский'
        },
        allStatuses: 'Все статусы',
        allCategories: 'Все категории',
        type: 'Тип',
        selectType: 'Выберите тип',
        selectTypeFirst: 'Сначала выберите тип',
        types: {
            league: 'Лига (Все против всех)',
            playoff: 'Плей-офф (На вылет)',
            group_playoff: 'Группа + Плей-офф'
        },
        startDate: 'Дата начала',
        maxTeams: 'Максимум команд',
        minPlayersPerTeam: 'Мин. игроков в команде',
        venue: 'Стадион / место',
        venuePlaceholder: 'Название стадиона или места',
        teamsCount: '{count} команд',
        description: 'Описание',
        descriptionPlaceholder: 'Детали турнира...',
        joinTournament: 'Присоединиться',
        leaveTournament: 'Покинуть турнир',
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
        requestPending: 'Запрос ожидает одобрения',
        joinSuccess: 'Запрос отправлен! Ожидайте одобрения организатора.',
        leaveSuccess: 'Вы покинули турнир!',
        pendingApproval: 'Ожидание одобрения организатора...',
        cancelRequest: 'Отменить заявку',
        registrationClosed: 'Регистрация закрыта (расписание уже создано)',
        round: 'Тур {num}',
        teamsJoined: '{current}/{max} команд',
        editTournament: 'Редактировать турнир',
        saveTournament: 'Сохранить изменения',
        deleteTournament: 'Удалить турнир',
        deleteTournamentConfirm: 'Вы уверены, что хотите удалить этот турнир?',
        bracketFinal: 'Финал',
        bracketSF: 'Полуфинал',
        bracketQF: 'Четвертьфинал',
        bracketR16: '1/8 финала'
    },

    // Fixtures settings
    fixturesSettings: {
        title: 'Настройки расписания',
        matchTime: 'Время матча',
        matchDays: 'Дни матчей',
        matchesPerDay: 'Матчей в день',
        matchCount: '{count} матч',
        matchesCount: '{count} матчей',
        generate: 'Создать',
        selectAtLeastOneDay: 'Выберите хотя бы один день',
        estimatedEnd: 'Турнир завершится приблизительно:',
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
        enterResults: 'Управление матчем',
        addGoal: 'Добавить гол',
        addCard: 'Добавить карточку',
        team: 'Команда',
        selectTeam: 'Выберите команду',
        player: 'Игрок',
        selectPlayer: 'Выберите игрока',
        minute: 'Минута',
        assist: 'Ассист',
        ownGoal: 'Автогол',
        cardType: 'Тип карточки',
        selectCardType: 'Выберите тип',
        yellowCard: 'Жёлтая карточка',
        redCard: 'Красная карточка',
        matchEvents: 'События матча',
        noEvents: 'Событий пока нет',
        goal: 'Гол',
        card: 'Карточка',
        finishMatch: 'Завершить матч',
        matchFinished: 'Матч завершён!',
        goalAdded: 'Гол добавлен!',
        cardAdded: 'Карточка добавлена!',
        eventDeleted: 'Событие удалено!',
        notStartedYet: 'Матч не начался',
        scoreUpdated: 'Счёт обновлён!'
    },

    // Teams
    teams: {
        title: 'Команды',
        totalTeams: 'Всего команд',
        players: 'Игроки',
        coaches: 'Тренеры',
        createTeam: 'Создать команду',
        myTeam: 'Моя команда',
        noTeams: 'Команд пока нет',
        createTeamCta: 'Создайте команду и начните играть!',
        teamName: 'Название команды',
        teamNamePlaceholder: 'ФК Барселона',
        descriptionPlaceholder: 'Расскажите о вашей команде...',
        logoColor: 'Цвет команды',
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
        goalsFor: 'Забито',
        goalsAgainst: 'Пропущено',
        editTeam: 'Редактировать команду',
        deleteTeam: 'Удалить команду',
        deleteTeamConfirm: 'Вы уверены, что хотите удалить эту команду?',
        teamDeleted: 'Команда удалена!',
        tournament: 'Турнир',
        noTournament: 'Не в турнире',
        playerCount: '{count}/25'
    },

    // Add player modal
    addPlayer: {
        title: 'Добавить игрока',
        searchPlayer: 'Поиск игрока',
        searchPlaceholder: 'Имя или email',
        search: 'Поиск',
        searchResults: 'Результаты поиска:',
        noPlayersFound: 'Игроки не найдены по запросу "{query}"',
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
        playerRemoved: 'Игрок удалён!'
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
        yellowCards: 'Жёлтые карточки',
        noYellowCards: 'Жёлтых карточек пока нет',
        redCards: 'Красные карточки',
        noRedCards: 'Красных карточек пока нет'
    },

    // Matches section
    matches: {
        total: 'Всего',
        upcoming: 'Предстоящие',
        finished: 'Завершённые',
        all: 'Все',
        allTournaments: 'Все турниры',
        allTeams: 'Все команды',
        noMatches: 'Матчей пока нет',
        noMatchesSubtitle: 'Матчи появятся здесь после создания расписания турниров!',
        scheduled: 'Запланирован',
        live: 'Live',
        today: 'Сегодня',
        tomorrow: 'Завтра',
        final: 'Финал',
        semiFinal: 'Полуфинал',
        quarterFinal: 'Четвертьфинал'
    },

    // Statistics section
    statistics: {
        global: 'Общая статистика',
        tournaments: 'Турниры',
        teams: 'Команды',
        matches: 'Матчи',
        players: 'Игроки',
        goals: 'Всего голов',
        topScorers: 'Лучшие бомбардиры',
        topAssists: 'Лучшие ассистенты',
        noData: 'Данных пока нет',
        noTeam: 'Без команды',
        gamesPlayed: 'игр',
        error: 'Не удалось загрузить статистику',
        errorSubtitle: 'Попробуйте обновить страницу',
        standings: 'Турнирная таблица',
        bracket: 'Сетка'
    },

    // Footer
    footer: {
        description: 'Лучшая платформа для управления футбольными турнирами.',
        quickLinks: 'Навигация',
        rights: 'Все права защищены.',
        madeWith: 'Сделано с <i class="fas fa-heart"></i> для футбола'
    },

    // Messages
    messages: {
        success: {
            login: 'Вы успешно вошли!',
            register: 'Аккаунт успешно создан!',
            tournamentCreated: 'Турнир успешно создан!',
            teamCreated: 'Команда успешно создана!',
            logout: 'Вы вышли из системы!',
            fixturesGenerated: 'Расписание успешно создано!',
            tournamentUpdated: 'Турнир успешно обновлён!',
            tournamentDeleted: 'Турнир удалён!',
            teamUpdated: 'Команда успешно обновлена!',
            profileUpdated: 'Профиль успешно обновлён!'
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
            leaveFailed: 'Не удалось покинуть турнир',
            generateFixturesFailed: 'Не удалось создать расписание',
            loadMatchDetails: 'Не удалось загрузить данные матча',
            finishMatchFailed: 'Не удалось завершить матч',
            addGoalFailed: 'Не удалось добавить гол',
            addCardFailed: 'Не удалось добавить карточку',
            deleteEventFailed: 'Не удалось удалить событие',
            allFieldsRequired: 'Все поля обязательны',
            teamAndPlayerRequired: 'Укажите команду и игрока',
            searchFailed: 'Ошибка поиска игроков',
            addPlayerFailed: 'Не удалось добавить игрока',
            removePlayerFailed: 'Не удалось удалить игрока',
            loadPlayersFailed: 'Не удалось загрузить игроков',
            deleteTeamFailed: 'Не удалось удалить команду'
        }
    },

    // Welcome
    welcome: 'Добро пожаловать в 11UNITY!'
});
