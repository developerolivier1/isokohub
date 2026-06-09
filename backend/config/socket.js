const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

const connectedUsers = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.tenantId = decoded.tenantId || socket.handshake.query.tenantId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      tenantId: socket.tenantId,
      connectedAt: new Date(),
    });

    if (socket.tenantId) {
      socket.join(`tenant:${socket.tenantId}`);
    }

    socket.join(`user:${socket.userId}`);

    socket.on('join:live', (liveStreamId) => {
      socket.join(`live:${liveStreamId}`);
      io.to(`live:${liveStreamId}`).emit('live:viewer-joined', {
        userId: socket.userId,
        liveStreamId,
        viewerCount: io.sockets.adapter.rooms.get(`live:${liveStreamId}`)?.size || 0,
      });
    });

    socket.on('leave:live', (liveStreamId) => {
      socket.leave(`live:${liveStreamId}`);
      io.to(`live:${liveStreamId}`).emit('live:viewer-left', {
        userId: socket.userId,
        liveStreamId,
        viewerCount: io.sockets.adapter.rooms.get(`live:${liveStreamId}`)?.size || 0,
      });
    });

    socket.on('live:comment', (data) => {
      io.to(`live:${data.liveStreamId}`).emit('live:new-comment', {
        userId: socket.userId,
        comment: data.comment,
        timestamp: new Date(),
      });
    });

    socket.on('live:reaction', (data) => {
      io.to(`live:${data.liveStreamId}`).emit('live:reaction-update', {
        userId: socket.userId,
        reaction: data.reaction,
        liveStreamId: data.liveStreamId,
      });
    });

    socket.on('order:status', (data) => {
      io.to(`user:${data.userId}`).emit('order:status-update', {
        orderId: data.orderId,
        status: data.status,
        timestamp: new Date(),
      });
    });

    socket.on('delivery:tracking', (data) => {
      io.to(`user:${data.userId}`).emit('delivery:location-update', {
        orderId: data.orderId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date(),
      });
    });

    socket.on('notification:send', (data) => {
      io.to(`user:${data.userId}`).emit('notification:new', {
        title: data.title,
        message: data.message,
        type: data.type,
        timestamp: new Date(),
      });
    });

    socket.on('vendor:new-order', (data) => {
      io.to(`user:${data.vendorId}`).emit('vendor:order-received', {
        orderId: data.orderId,
        customerName: data.customerName,
        total: data.total,
        timestamp: new Date(),
      });
    });

    socket.on('chat:message', (data) => {
      const roomName = [data.fromUserId, data.toUserId].sort().join(':');
      io.to(`user:${data.toUserId}`).emit('chat:new-message', {
        fromUserId: socket.userId,
        message: data.message,
        conversationId: `conv:${roomName}`,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      connectedUsers.delete(socket.userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToTenant = (tenantId, event, data) => {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  getConnectedUsers,
  isUserOnline,
  emitToUser,
  emitToTenant,
};
