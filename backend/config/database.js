/* ==============================================
   DATABASE - Подключение к MySQL
   ============================================== */

const mysql = require('mysql2');

// Создаём pool соединений
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Экспортируем pool с promise wrapper
module.exports = pool;

// Логирование ошибок pool
pool.on('error', (err) => {
    console.error('🚨 Database pool error:', err.message);
});

console.log('📦 Database pool created');