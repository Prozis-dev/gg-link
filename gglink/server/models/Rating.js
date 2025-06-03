const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: { // Quem está avaliando
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratedUser: { // Quem está sendo avaliado
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lobby: { // O lobby em que a interação ocorreu
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
    required: true
  },
  stars: { // Pontuação de estrelas (1-5)
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: { // Comentário opcional
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rating', ratingSchema);