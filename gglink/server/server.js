require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/authRoutes');
const lobbyRoutes = require('./routes/lobbyRoutes');
const communityRoutes = require('./routes/communityRoutes');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gglink_db';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('ERRO: JWT_SECRET não definido nas variáveis de ambiente!');
  process.exit(1);
}

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000"
}));
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/communities', communityRoutes);

// Middleware de autenticação para Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Autenticação necessária para WebSocket.'));

  try {
    const decoded = jwt.verify(token, jwtSecret);
    socket.user = decoded.user;
    const user = await User.findById(decoded.user.id);
    if (!user) return next(new Error('Usuário não encontrado.'));
    socket.username = user.username;
    next();
  } catch (err) {
    next(new Error('Token de autenticação inválido.'));
  }
});

// Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log(`Cliente conectado via Socket.IO: ${socket.id} (Usuário: ${socket.username})`);

  // ======== LOBBY ========
  socket.on('joinLobby', async (lobbyId) => {
    if (!mongoose.Types.ObjectId.isValid(lobbyId)) {
      socket.emit('lobbyError', 'ID de lobby inválido.');
      return;
    }
    socket.join(lobbyId);
    socket.currentLobby = lobbyId;

    console.log(`${socket.username} (${socket.id}) entrou no lobby: ${lobbyId}`);
    io.to(lobbyId).emit('userJoinedLobby', {
      userId: socket.user.id,
      username: socket.username,
      lobbyId: lobbyId,
      message: `${socket.username} entrou no lobby.`
    });
  });

  socket.on('leaveLobby', (lobbyId) => {
    if (socket.currentLobby === lobbyId) {
      socket.leave(lobbyId);
      console.log(`${socket.username} (${socket.id}) saiu do lobby: ${lobbyId}`);
      io.to(lobbyId).emit('userLeftLobby', {
        userId: socket.user.id,
        username: socket.username,
        lobbyId: lobbyId,
        message: `${socket.username} saiu do lobby.`
      });
      delete socket.currentLobby;
    }
  });

  socket.on('sendMessage', (messageData) => {
    const { lobbyId, message } = messageData;
    if (socket.currentLobby === lobbyId) {
      const chatMessage = {
        userId: socket.user.id,
        username: socket.username,
        message: message,
        timestamp: new Date().toISOString()
      };
      io.to(lobbyId).emit('receiveMessage', chatMessage);
      console.log(`[LOBBY ${lobbyId}] ${socket.username}: ${message}`);
    } else {
      socket.emit('lobbyError', 'Você não está neste lobby ou o lobby ID é inválido.');
    }
  });

  // ======== COMUNIDADE ========
  socket.on('joinCommunity', async (communityId) => {
    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      socket.emit('communityError', 'ID de comunidade inválido.');
      return;
    }

    socket.leaveAll(); // Sai de todas as salas anteriores
    socket.join(`community-${communityId}`);
    socket.currentRoom = `community-${communityId}`;

    console.log(`${socket.username} (${socket.id}) entrou na comunidade: ${communityId}`);

    io.to(`community-${communityId}`).emit('communityUserJoined', {
      userId: socket.user.id,
      username: socket.username,
      communityId: communityId,
      message: `${socket.username} entrou na comunidade.`
    });
  });

  socket.on('leaveCommunity', (communityId) => {
    if (socket.currentRoom === `community-${communityId}`) {
      socket.leave(`community-${communityId}`);
      console.log(`${socket.username} (${socket.id}) saiu da comunidade: ${communityId}`);
      io.to(`community-${communityId}`).emit('communityUserLeft', {
        userId: socket.user.id,
        username: socket.username,
        communityId: communityId,
        message: `${socket.username} saiu da comunidade.`
      });
      delete socket.currentRoom;
    }
  });

  socket.on('sendCommunityMessage', (messageData) => {
    const { communityId, message } = messageData;
    if (socket.currentRoom === `community-${communityId}`) {
      const chatMessage = {
        userId: socket.user.id,
        username: socket.username,
        message: message,
        timestamp: new Date().toISOString()
      };
      io.to(`community-${communityId}`).emit('receiveCommunityMessage', chatMessage);
      console.log(`[COMMUNITY ${communityId}] ${socket.username}: ${message}`);
    } else {
      socket.emit('communityError', 'Você não está nesta comunidade ou o ID é inválido.');
    }
  });

  // ======== DESCONECTAR ========
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);

    if (socket.currentRoom?.startsWith('community-')) {
      const communityId = socket.currentRoom.replace('community-', '');
      io.to(socket.currentRoom).emit('communityUserLeft', {
        userId: socket.user.id,
        username: socket.username,
        communityId: communityId,
        message: `${socket.username} desconectou da comunidade.`
      });
    }

    if (socket.currentLobby) {
      io.to(socket.currentLobby).emit('userLeftLobby', {
        userId: socket.user.id,
        username: socket.username,
        lobbyId: socket.currentLobby,
        message: `${socket.username} desconectou do lobby.`
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
