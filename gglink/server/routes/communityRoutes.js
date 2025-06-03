const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const auth = require('../middlewares/authMiddleware'); // Nosso middleware de autenticação

// Rota para listar todas as comunidades
router.get('/', auth, communityController.getCommunities);

// Rota para obter detalhes de uma comunidade específica
router.get('/:id', auth, communityController.getCommunityById);

// Rota para entrar em uma comunidade
router.put('/:id/join', auth, communityController.joinCommunity);

// Rota para sair de uma comunidade
router.put('/:id/leave', auth, communityController.leaveCommunity);

module.exports = router;