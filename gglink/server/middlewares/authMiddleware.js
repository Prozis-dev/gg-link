const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
  // Obter o token do cabeçalho
  const token = req.header('x-auth-token'); // Convenção comum: 'x-auth-token'

  // Verificar se não há token
  if (!token) {
    return res.status(401).json({ msg: 'Nenhum token, autorização negada' });
  }

  // Verificar token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user; // Adiciona o payload do usuário (id) ao objeto de requisição
    next(); // Continua para a próxima função middleware/rota
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido' });
  }
};