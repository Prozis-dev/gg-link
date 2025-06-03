const express = require('express');
const router = express.Router();
const lobbyController = require('../controllers/lobbyController');
const auth = require('../middlewares/authMiddleware'); // Nosso middleware de autenticação

// Rota para criar um novo lobby (protegida)
router.post('/', auth, lobbyController.createLobby);

// Rota para listar todos os lobbies (com filtros, protegida)
router.get('/', auth, lobbyController.getLobbies);

// Rota para entrar em um lobby (protegida)
router.put('/:id/join', auth, lobbyController.joinLobby);

// Rota para sair de um lobby (protegida)
router.put('/:id/leave', auth, lobbyController.leaveLobby);

// Rota para deletar um lobby (protegida, apenas dono)
router.delete('/:id', auth, lobbyController.deleteLobby);

module.exports = router;