const mongoose = require('mongoose');

const lobbySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  game: {
    type: String,
    required: true,
    trim: true
  },
  mode: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 2, // Mínimo de 2 jogadores para um lobby
    max: 10 // Capacidade máxima até 10 jogadores
  },
  currentPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Referencia o modelo de Usuário
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillLevel: { // Nível de habilidade desejado para o lobby
    type: String,
    enum: ['Qualquer', 'Iniciante', 'Intermediário', 'Avançado', 'Pro'],
    default: 'Qualquer'
  },
  imageUrl: { // Placeholder para imagem opcional
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Lobby', lobbySchema);