/* ==============================================
   SERVER - Главный файл Express сервера
   ============================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========

// CORS - разрешаем запросы с frontend
app.use(cors());

// JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// ========== DATABASE CONNECTION ==========

const db = require('./config/database');

// Проверка подключения к БД
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected successfully!');
    connection.release();
});

// ========== ROUTES ==========

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const teamRoutes = require('./routes/teams');

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);

// ========== ROOT ENDPOINT ==========

app.get('/', (req, res) => {
    res.json({
        message: '⚽ Welcome to 11UNITY API!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            tournaments: '/api/tournaments',
            teams: '/api/teams',
        }
    });
});

// ========== 404 HANDLER ==========

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// ========== ERROR HANDLER ==========

app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 11UNITY Backend Server');
    console.log('═══════════════════════════════════════');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════');
});

// ========== GRACEFUL SHUTDOWN ==========

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Closing server...');
    db.end(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
    });
});