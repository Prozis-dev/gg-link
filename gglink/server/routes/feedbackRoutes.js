const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middlewares/authMiddleware'); // Nosso middleware de autenticação

// Rota para submeter uma avaliação
router.post('/rate', auth, feedbackController.submitRating);

// Rota para submeter uma denúncia
router.post('/report', auth, feedbackController.submitReport);

module.exports = router;