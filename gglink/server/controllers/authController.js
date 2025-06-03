const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Obtenha a chave secreta JWT das variáveis de ambiente
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('ERRO: JWT_SECRET não definido nas variáveis de ambiente!');
  process.exit(1); // Encerra o aplicativo se a chave secreta não estiver definida
}

// @route   POST /api/auth/register
// @desc    Registra um novo usuário
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Verificar se o usuário já existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Usuário com este e-mail já existe.' });
    }

    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Nome de usuário já existe.' });
    }

    // 2. Criar uma nova instância de usuário
    user = new User({
      username,
      email,
      password
    });

    // 3. Criptografar a senha
    const salt = await bcrypt.genSalt(10); // Gerar um "salt" (valor aleatório)
    user.password = await bcrypt.hash(password, salt); // Hash da senha com o salt

    // 4. Salvar o usuário no banco de dados
    await user.save();

    // 5. Gerar JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' }, // Token expira em 1 hora
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, msg: 'Usuário registrado com sucesso!' });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

// @route   POST /api/auth/login
// @desc    Autentica usuário e retorna token JWT
// @access  Public
exports.loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier pode ser email ou username

  try {
    // 1. Encontrar o usuário por email ou username
    let user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(400).json({ msg: 'Credenciais inválidas.' });
    }

    // 2. Comparar a senha fornecida com a senha criptografada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciais inválidas.' });
    }

    // 3. Gerar JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' }, // Token expira em 1 hora
      (err, token) => {
        if (err) throw err;
        res.json({ token, msg: 'Login realizado com sucesso!' });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};