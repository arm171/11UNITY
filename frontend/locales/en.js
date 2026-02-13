// ============================================
// ENGLISH TRANSLATIONS
// ============================================

I18n.registerTranslations('en', {
    // Common
    common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        close: 'Close',
        yes: 'Yes',
        no: 'No',
        at: 'at',
        vs: 'VS',
        tbd: 'TBD',
        unknown: 'Unknown',
        noDescription: 'No description available.',
        confirmLogout: 'Are you sure you want to logout?',
        optional: 'optional'
    },

    // Navigation
    nav: {
        home: 'Home',
        tournaments: 'Tournaments',
        teams: 'Teams',
        matches: 'Matches',
        statistics: 'Statistics',
        getStarted: 'Get Started'
    },

    // Hero section
    hero: {
        title: 'Welcome to 11UNITY',
        subtitle: 'The ultimate platform for managing football tournaments. Create teams, organize tournaments, track matches, and analyze statistics.',
        cta: 'Start Your Tournament'
    },

    // Profile
    profile: {
        title: 'Profile',
        language: 'Language',
        memberSince: 'Member since',
        dashboard: 'Dashboard',
        myTeam: 'My Team',
        myTournament: 'My Tournament',
        myTournaments: 'My Tournaments',
        noTeam: 'No team yet',
        noTournament: 'No active tournament',
        tournamentsCreated: 'Tournaments created',
        activeTournaments: 'Active tournaments',
        totalTournaments: 'Total',
        personalStats: 'Personal Stats',
        teamOverview: 'Team Overview',
        teamRecord: 'Team Record',
        roster: 'Roster',
        recentMatches: 'Recent Matches',
        position: 'Position',
        jersey: 'Jersey',
        goals: 'Goals',
        assists: 'Assists',
        yellowCards: 'Yellow Cards',
        redCards: 'Red Cards',
        matches: 'Matches',
        wins: 'Wins',
        draws: 'Draws',
        losses: 'Losses',
        goalsFor: 'Goals For',
        goalsAgainst: 'Goals Against'
    },

    // Auth
    auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        fullName: 'Full Name',
        role: 'Role',
        selectRole: 'Select your role',
        createAccount: 'Create Account',
        emailPlaceholder: 'your@email.com',
        passwordPlaceholder: '........',
        namePlaceholder: 'John Doe',
        passwordsDoNotMatch: 'Passwords do not match!',
        roles: {
            player: 'Player',
            coach: 'Coach',
            organizer: 'Organizer'
        }
    },

    // Tournaments
    tournaments: {
        title: 'Tournaments',
        total: 'Total',
        active: 'Active',
        finished: 'Finished',
        upcoming: 'Upcoming',
        createTournament: 'Create Tournament',
        noTournaments: 'No tournaments yet',
        beFirst: 'Be the first to create a tournament!',
        tournamentName: 'Tournament Name',
        tournamentNamePlaceholder: 'Champions League 2026',
        category: 'Category',
        selectCategory: 'Select category',
        categories: {
            school: 'School',
            university: 'University',
            amateur: 'Amateur'
        },
        allCategories: 'All Categories',
        type: 'Type',
        selectType: 'Select type',
        selectTypeFirst: 'Select type first',
        types: {
            league: 'League (All vs All)',
            playoff: 'Playoff (Knockout)',
            group_playoff: 'Group + Playoff'
        },
        startDate: 'Start Date',
        maxTeams: 'Maximum Teams',
        minPlayersPerTeam: 'Min Players Per Team',
        teamsCount: '{count} teams',
        description: 'Description',
        descriptionPlaceholder: 'Tournament details...',
        joinTournament: 'Join Tournament',
        leaveTournament: 'Leave Tournament',
        generateFixtures: 'Generate Fixtures',
        standings: 'Standings',
        statistics: 'Statistics',
        fixtures: 'Fixtures',
        noStandings: 'No Standings Yet',
        standingsSubtitle: 'Standings will appear after matches are played',
        noStatistics: 'No Statistics Yet',
        statisticsSubtitle: 'Player statistics will appear after match events are recorded',
        noFixtures: 'No Fixtures Yet',
        fixturesSubtitle: 'Generate fixtures to see the match schedule!',
        teamParticipating: 'Your team is participating in this tournament',
        needTeamFirst: 'You need to create a team first',
        tournamentFull: 'Tournament is full',
        joinSuccess: 'Successfully joined the tournament!',
        leaveSuccess: 'Successfully left the tournament!',
        round: 'Round {num}',
        teamsJoined: '{current}/{max} teams'
    },

    // Fixtures settings
    fixturesSettings: {
        title: 'Generate Fixtures Settings',
        matchTime: 'Match Time',
        matchDays: 'Match Days',
        matchesPerDay: 'Matches Per Day',
        matchCount: '{count} match',
        matchesCount: '{count} matches',
        generate: 'Generate',
        selectAtLeastOneDay: 'Select at least one match day',
        days: {
            mon: 'Mon',
            tue: 'Tue',
            wed: 'Wed',
            thu: 'Thu',
            fri: 'Fri',
            sat: 'Sat',
            sun: 'Sun'
        }
    },

    // Match
    match: {
        enterResults: 'Match Management',
        addGoal: 'Add Goal',
        addCard: 'Add Card',
        team: 'Team',
        selectTeam: 'Select team',
        player: 'Player',
        selectPlayer: 'Select player',
        minute: 'Minute',
        assist: 'Assist',
        ownGoal: 'Own Goal',
        cardType: 'Card Type',
        selectCardType: 'Select type',
        yellowCard: 'Yellow Card',
        redCard: 'Red Card',
        matchEvents: 'Match Events',
        noEvents: 'No events yet',
        goal: 'Goal',
        card: 'Card',
        finishMatch: 'Finish Match',
        matchFinished: 'Match finished!',
        goalAdded: 'Goal added!',
        cardAdded: 'Card added!',
        eventDeleted: 'Event deleted!'
    },

    // Teams
    teams: {
        title: 'Teams',
        totalTeams: 'Total Teams',
        players: 'Players',
        coaches: 'Coaches',
        createTeam: 'Create Team',
        myTeam: 'My Team',
        noTeams: 'No teams yet',
        createTeamCta: 'Create your team and start playing!',
        teamName: 'Team Name',
        teamNamePlaceholder: 'FC Barcelona',
        logoColor: 'Team Color',
        playersCount: '{count} players',
        coach: 'Coach',
        notSpecified: 'Not specified',
        noDescriptionProvided: 'No description provided',
        teamPlayers: 'Team Players',
        addPlayer: 'Add Player',
        noPlayers: 'No players yet',
        addPlayersCta: 'Add players to your team!',
        matches: 'Matches',
        wins: 'Wins',
        draws: 'Draws',
        losses: 'Losses',
        goalsFor: 'Goals For',
        goalsAgainst: 'Goals Against',
        deleteTeam: 'Delete Team',
        deleteTeamConfirm: 'Are you sure you want to delete this team?',
        teamDeleted: 'Team deleted!',
        tournament: 'Tournament',
        noTournament: 'Not in a tournament',
        playerCount: '{count}/25'
    },

    // Add player modal
    addPlayer: {
        title: 'Add Player',
        searchPlayer: 'Search Player',
        searchPlaceholder: 'Name or email',
        search: 'Search',
        searchResults: 'Search Results:',
        noPlayersFound: 'No players found for "{query}"',
        alreadyInTeam: 'Already in a team',
        select: 'Select',
        playerDetails: 'Player Details:',
        jerseyNumber: 'Jersey Number (1-99)',
        jerseyPlaceholder: '10',
        position: 'Position',
        selectPosition: 'Select position',
        positions: {
            goalkeeper: 'Goalkeeper',
            defender: 'Defender',
            midfielder: 'Midfielder',
            forward: 'Forward'
        },
        addToTeam: 'Add to Team',
        playerAdded: 'Player added successfully!',
        removePlayer: 'Remove player',
        confirmRemove: 'Are you sure you want to remove this player from the team?',
        playerRemoved: 'Player removed successfully!'
    },

    // Statistics table headers
    stats: {
        rank: '#',
        team: 'Team',
        played: 'P',
        won: 'W',
        drawn: 'D',
        lost: 'L',
        goalsFor: 'GF',
        goalsAgainst: 'GA',
        goalDifference: 'GD',
        points: 'Pts',
        player: 'Player',
        goals: 'Goals',
        cards: 'Cards',
        topScorers: 'Top Scorers',
        noGoalsScored: 'No goals scored yet',
        yellowCards: 'Yellow Cards',
        noYellowCards: 'No yellow cards yet',
        redCards: 'Red Cards',
        noRedCards: 'No red cards yet'
    },

    // Matches section
    matches: {
        total: 'Total',
        upcoming: 'Upcoming',
        finished: 'Finished',
        all: 'All',
        allTournaments: 'All Tournaments',
        noMatches: 'No matches yet',
        noMatchesSubtitle: 'Matches will appear here once tournaments generate fixtures!',
        live: 'Live'
    },

    // Statistics section
    statistics: {
        global: 'Global Statistics',
        tournaments: 'Tournaments',
        teams: 'Teams',
        matches: 'Matches',
        players: 'Players',
        goals: 'Total Goals',
        topScorers: 'Top Scorers',
        topAssists: 'Top Assists',
        noData: 'No data available yet',
        noTeam: 'No team',
        gamesPlayed: 'games',
        error: 'Failed to load statistics',
        errorSubtitle: 'Please try refreshing the page',
        standings: 'Standings'
    },

    // Footer
    footer: {
        description: 'The ultimate platform for managing football tournaments.',
        quickLinks: 'Quick Links',
        rights: 'All rights reserved.',
        madeWith: 'Made with <i class="fas fa-heart"></i> for football'
    },

    // Messages
    messages: {
        success: {
            login: 'Successfully logged in!',
            register: 'Account created successfully!',
            tournamentCreated: 'Tournament created successfully!',
            teamCreated: 'Team created successfully!',
            logout: 'Logged out successfully!',
            fixturesGenerated: 'Fixtures generated successfully!'
        },
        error: {
            loginFailed: 'Login failed. Please check your credentials.',
            registerFailed: 'Registration failed. Please try again.',
            loadTournaments: 'Failed to load tournaments.',
            loadTeams: 'Failed to load teams.',
            createTournament: 'Failed to create tournament.',
            createTeam: 'Failed to create team.',
            unauthorized: 'Please login to continue.',
            networkError: 'Network error. Please check your connection.',
            onlyOrganizers: 'Only organizers can create tournaments',
            onlyCoaches: 'Only coaches can create teams',
            joinFailed: 'Failed to join tournament',
            leaveFailed: 'Failed to leave tournament',
            generateFixturesFailed: 'Failed to generate fixtures',
            loadMatchDetails: 'Failed to load match details',
            finishMatchFailed: 'Failed to finish match',
            addGoalFailed: 'Failed to add goal',
            addCardFailed: 'Failed to add card',
            deleteEventFailed: 'Failed to delete event',
            allFieldsRequired: 'All fields are required',
            teamAndPlayerRequired: 'Team and player are required',
            searchFailed: 'Failed to search players',
            addPlayerFailed: 'Failed to add player',
            removePlayerFailed: 'Failed to remove player',
            loadPlayersFailed: 'Failed to load players',
            deleteTeamFailed: 'Failed to delete team'
        }
    },

    // Welcome
    welcome: 'Welcome to 11UNITY!'
});
