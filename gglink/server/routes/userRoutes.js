const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   GET /api/users/me
// @desc    Obtém o perfil do usuário logado (incluindo avaliações recebidas)
// @access  Private
router.get('/me', authMiddleware, userController.getLoggedInUserProfile);

// @route   PUT /api/users/me
// @desc    Atualiza o perfil do usuário logado
// @access  Private
router.put('/me', authMiddleware, userController.updateUserProfile);

// @route   GET /api/users/profile/:userId
// @desc    Obtém o perfil público de um usuário (incluindo avaliações recebidas)
// @access  Private (ou Public, dependendo dos requisitos)
router.get('/profile/:userId', authMiddleware, userController.getUserProfileById);


module.exports = router;