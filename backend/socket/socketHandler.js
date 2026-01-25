/**
 * SOCKET HANDLER
 * Socket.IO initialization and JWT authentication
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO with HTTP server
 * @param {Object} httpServer - Node.js HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // JWT Authentication middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            // Allow unauthenticated connections for public data
            socket.user = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            console.error('Socket auth error:', error.message);
            socket.user = null;
            next();
        }
    });

    // Connection handling
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id,
            socket.user ? `(User: ${socket.user.id})` : '(Anonymous)');

        // Join tournament room for targeted updates
        socket.on('tournament:join', (tournamentId) => {
            const room = `tournament:${tournamentId}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined ${room}`);
        });

        // Leave tournament room
        socket.on('tournament:leave', (tournamentId) => {
            const room = `tournament:${tournamentId}`;
            socket.leave(room);
            console.log(`Socket ${socket.id} left ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });

    console.log('Socket.IO initialized');
    return io;
};

/**
 * Get Socket.IO instance
 * @returns {Object} Socket.IO server instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

/**
 * Emit event to specific tournament room
 * @param {number} tournamentId - Tournament ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToTournament = (tournamentId, event, data) => {
    if (!io) return;
    const room = `tournament:${tournamentId}`;
    io.to(room).emit(event, data);
    console.log(`Emitted ${event} to ${room}`);
};

module.exports = {
    initSocket,
    getIO,
    emitToTournament
};
