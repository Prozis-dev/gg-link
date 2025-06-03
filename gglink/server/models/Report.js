const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { // Quem está denunciando
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: { // Quem está sendo denunciado
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lobby: { // O lobby em que a interação ocorreu
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby',
    required: true
  },
  reason: { // Motivo da denúncia
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: { // Status da denúncia (pendente, revisada, resolvida)
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);