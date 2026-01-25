/**
 * 11UNITY BACKEND SERVER
 * Main Express server configuration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const { initSocket } = require('./socket/socketHandler');
initSocket(server);
const PORT = process.env.PORT || 3000;

/**
 * MIDDLEWARE CONFIGURATION
 */

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

/**
 * DATABASE CONNECTION
 */

const db = require('./config/database');

// Verify database connection on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('Database connected successfully');
    connection.release();
});

/**
 * API ROUTES
 */

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const teamRoutes = require('./routes/teams');

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to 11UNITY API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            tournaments: '/api/tournaments',
            teams: '/api/teams',
        }
    });
});

/**
 * 404 Error Handler
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/**
 * START SERVER
 */
server.listen(PORT, () => {
    console.log('=======================================');
    console.log('11UNITY Backend Server');
    console.log('=======================================');
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('=======================================');
});

/**
 * GRACEFUL SHUTDOWN
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    server.close(() => {
        db.end(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});