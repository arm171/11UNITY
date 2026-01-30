-- ===============================================
-- 11UNITY - DATABASE SCHEMA
-- Football Tournament Management System
-- ===============================================

-- Drop database if exists (CAREFUL IN PRODUCTION!)
-- DROP DATABASE IF EXISTS 11unity;

-- Create database
CREATE DATABASE IF NOT EXISTS 11unity
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE 11unity;

-- ===============================================
-- USERS TABLE
-- ===============================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('player', 'coach', 'organizer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TOURNAMENTS TABLE
-- ===============================================

CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('league', 'playoff', 'group_playoff') NOT NULL,
    category ENUM('school', 'university', 'amateur') NOT NULL DEFAULT 'amateur',
    start_date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    max_teams INT NOT NULL DEFAULT 8,
    min_players_per_team INT NOT NULL DEFAULT 11,
    status ENUM('upcoming', 'active', 'finished') DEFAULT 'upcoming',
    organizer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_organizer (organizer_id),
    INDEX idx_start_date (start_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TEAMS TABLE
-- ===============================================

CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(10),  -- 2-3 letter abbreviation (auto-generated from name)
    logo_color VARCHAR(7) DEFAULT '#2ecc71',  -- Hex color code
    description TEXT,
    max_players INT NOT NULL DEFAULT 25,  -- Fixed at 25
    coach_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_coach (coach_id),
    UNIQUE KEY unique_coach_team (coach_id)  -- One team per coach
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TEAM_PLAYERS TABLE (Many-to-Many: Teams <-> Players)
-- ===============================================

CREATE TABLE team_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    player_id INT NOT NULL,
    position ENUM('goalkeeper', 'defender', 'midfielder', 'forward'),
    jersey_number INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_team (team_id),
    INDEX idx_player (player_id),
    UNIQUE KEY unique_team_player (team_id, player_id),  -- Player can't join same team twice
    UNIQUE KEY unique_player (player_id),  -- One player = one team only
    UNIQUE KEY unique_team_jersey (team_id, jersey_number)  -- Unique jersey per team
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- TOURNAMENT_TEAMS TABLE (Many-to-Many: Tournaments <-> Teams)
-- ===============================================

CREATE TABLE tournament_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_team (team_id),
    UNIQUE KEY unique_tournament_team (tournament_id, team_id)  -- Team can't join tournament twice
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- MATCHES TABLE
-- ===============================================

CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team1_id INT NOT NULL,
    team2_id INT NOT NULL,
    match_date DATETIME,
    round VARCHAR(50),  -- e.g., "Round 1", "Quarter Final", "Semi Final"
    team1_score INT DEFAULT 0,
    team2_score INT DEFAULT 0,
    status ENUM('scheduled', 'in_progress', 'finished', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_team1 (team1_id),
    INDEX idx_team2 (team2_id),
    INDEX idx_status (status),
    INDEX idx_match_date (match_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- MATCH_EVENTS TABLE (Goals, Cards, Substitutions)
-- ===============================================

CREATE TABLE match_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    player_id INT NOT NULL,
    event_type ENUM('goal', 'yellow_card', 'red_card', 'substitution') NOT NULL,
    minute INT,
    is_own_goal BOOLEAN DEFAULT FALSE,  -- For own goals
    assist_player_id INT NULL,  -- Player who assisted (for goals)
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assist_player_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_match (match_id),
    INDEX idx_team (team_id),
    INDEX idx_player (player_id),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- STANDINGS TABLE (League standings)
-- ===============================================

CREATE TABLE standings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    drawn INT DEFAULT 0,
    lost INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    goal_difference INT DEFAULT 0,
    points INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_team (team_id),
    INDEX idx_points (points),
    UNIQUE KEY unique_tournament_team_standing (tournament_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- PLAYER_STATISTICS TABLE
-- ===============================================

CREATE TABLE player_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    yellow_cards INT DEFAULT 0,
    red_cards INT DEFAULT 0,
    matches_played INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id),
    INDEX idx_player (player_id),
    INDEX idx_team (team_id),
    INDEX idx_goals (goals),
    INDEX idx_assists (assists),
    UNIQUE KEY unique_tournament_player_stats (tournament_id, player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ===============================================

-- Sample Users
INSERT INTO users (name, email, password, role) VALUES
('John Organizer', 'organizer@test.com', '$2a$10$YourHashedPasswordHere', 'organizer'),
('Mike Coach', 'coach@test.com', '$2a$10$YourHashedPasswordHere', 'coach'),
('Tom Player', 'player@test.com', '$2a$10$YourHashedPasswordHere', 'player');

-- ===============================================
-- USEFUL QUERIES
-- ===============================================

-- Get tournament with teams count
/*
SELECT
    t.*,
    u.name as organizer_name,
    COUNT(DISTINCT tt.team_id) as teams_count
FROM tournaments t
LEFT JOIN users u ON t.organizer_id = u.id
LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
GROUP BY t.id;
*/

-- Get team with players count
/*
SELECT
    t.*,
    u.name as coach_name,
    COUNT(DISTINCT tp.player_id) as players_count
FROM teams t
LEFT JOIN users u ON t.coach_id = u.id
LEFT JOIN team_players tp ON t.id = tp.team_id
GROUP BY t.id;
*/

-- Get standings for a tournament (with tiebreaker order)
/*
SELECT
    s.*,
    t.name as team_name,
    t.logo,
    t.logo_color
FROM standings s
JOIN teams t ON s.team_id = t.id
WHERE s.tournament_id = ?
ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC, t.name ASC;
*/

-- Get top scorers in a tournament
/*
SELECT
    ps.*,
    u.name as player_name,
    t.name as team_name
FROM player_statistics ps
JOIN users u ON ps.player_id = u.id
JOIN teams t ON ps.team_id = t.id
WHERE ps.tournament_id = ?
ORDER BY ps.goals DESC
LIMIT 10;
*/

-- ===============================================
-- END OF SCHEMA
-- ===============================================
