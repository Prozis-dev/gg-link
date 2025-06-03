const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: 'Comunidade para gamers apaixonados por este jogo!'
  },
  game: { // O jogo associado à comunidade (para as comunidades fixas)
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  members: [{ // Usuários que fazem parte da comunidade
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  imageUrl: { // Imagem de capa da comunidade
    type: String,
    default: 'https://via.placeholder.com/300x150/1a1a2e/e0e0e0?text=Comunidade'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Community', communitySchema);