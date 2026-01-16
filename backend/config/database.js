/**
 * DATABASE CONFIGURATION
 * MySQL connection pool setup
 */

const mysql = require('mysql2');

/**
 * Create connection pool for database
 * Using connection pooling for better performance and resource management
 */
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

/**
 * Handle pool errors
 */
pool.on('error', (err) => {
    console.error('Database pool error:', err.message);
});

console.log('Database pool created');

module.exports = pool;