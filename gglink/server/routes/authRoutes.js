const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para registro de usuário
router.post('/register', authController.registerUser);

// Rota para login de usuário
router.post('/login', authController.loginUser);

module.exports = router;