require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Para verificar o token JWT na conexão WebSocket

const authRoutes = require('./routes/authRoutes');
const lobbyRoutes = require('./routes/lobbyRoutes');
const User = require('./models/User'); // Importe o modelo de Usuário para buscar o nome

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

// Usar as rotas de autenticação
app.use('/api/auth', authRoutes);
// Usar as rotas de lobbies
app.use('/api/lobbies', lobbyRoutes);

// ----- Socket.IO para Comunicação em Tempo Real -----
// Aprimore a autenticação do Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token; // Pega o token do handshake
  if (!token) {
    return next(new Error('Autenticação necessária para WebSocket.'));
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    socket.user = decoded.user; // Anexa o payload do usuário ao socket
    // Opcional: Buscar o nome de usuário do banco de dados para o chat
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return next(new Error('Usuário não encontrado.'));
    }
    socket.username = user.username; // Adiciona o username ao socket
    next();
  } catch (err) {
    next(new Error('Token de autenticação inválido.'));
  }
});


io.on('connection', (socket) => {
  console.log(`Cliente conectado via Socket.IO: ${socket.id} (Usuário: ${socket.username})`);

  // Evento para entrar em um lobby específico
  socket.on('joinLobby', async (lobbyId) => {
    // Verifique se o lobby existe e se o usuário tem permissão para entrar (opcional, já feito na API REST)
    // Para fins do chat, vamos apenas permitir a junção se o lobbyId for válido
    if (!mongoose.Types.ObjectId.isValid(lobbyId)) {
      socket.emit('lobbyError', 'ID de lobby inválido.');
      return;
    }

    // Deixa o socket entrar em uma "sala" específica para este lobby
    socket.join(lobbyId);
    socket.currentLobby = lobbyId; // Armazena o lobby atual do usuário no socket

    console.log(`${socket.username} (${socket.id}) entrou no lobby: ${lobbyId}`);

    // Informa aos outros membros do lobby que um novo usuário entrou
    io.to(lobbyId).emit('userJoinedLobby', {
      userId: socket.user.id,
      username: socket.username,
      lobbyId: lobbyId,
      message: `${socket.username} entrou no lobby.`
    });

    // Opcional: Enviar a lista atual de membros para o usuário que acabou de entrar
    // (Ainda não implementado, mas é um próximo passo lógico)
  });

  // Evento para sair de um lobby
  socket.on('leaveLobby', (lobbyId) => {
    if (socket.currentLobby === lobbyId) {
      socket.leave(lobbyId);
      console.log(`${socket.username} (${socket.id}) saiu do lobby: ${lobbyId}`);
      // Informa aos outros membros do lobby que um usuário saiu
      io.to(lobbyId).emit('userLeftLobby', {
        userId: socket.user.id,
        username: socket.username,
        lobbyId: lobbyId,
        message: `${socket.username} saiu do lobby.`
      });
      delete socket.currentLobby;
    }
  });


  // Evento para envio de mensagens de chat
  socket.on('sendMessage', (messageData) => {
    const { lobbyId, message } = messageData;
    if (socket.currentLobby === lobbyId) { // Garante que a mensagem é para o lobby certo
      const chatMessage = {
        userId: socket.user.id,
        username: socket.username,
        message: message,
        timestamp: new Date().toISOString()
      };
      // Envia a mensagem apenas para a "sala" (lobby) específica
      io.to(lobbyId).emit('receiveMessage', chatMessage);
      console.log(`[LOBBY ${lobbyId}] ${socket.username}: ${message}`);
    } else {
      socket.emit('lobbyError', 'Você não está neste lobby ou o lobby ID é inválido.');
    }
  });

  // Manipular desconexão
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    // Se o usuário estava em um lobby, informa a saída
    if (socket.currentLobby) {
      io.to(socket.currentLobby).emit('userLeftLobby', {
        userId: socket.user.id,
        username: socket.username,
        lobbyId: socket.currentLobby,
        message: `${socket.username} desconectou.`
      });
    }
  });
});


server.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});