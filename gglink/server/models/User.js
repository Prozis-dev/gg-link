const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Por favor, insira um e-mail válido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePictureUrl: { // Novo campo
    type: String,
    default: 'https://via.placeholder.com/150/1a1a2e/e0e0e0?text=Avatar' // URL de um avatar padrão
  },
  favoriteGame: { // Novo campo
    type: String,
    trim: true,
    default: ''
  },
  bio: { // Novo campo (opcional)
    type: String,
    maxlength: 250,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);