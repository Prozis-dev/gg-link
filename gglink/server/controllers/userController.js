const User = require('../models/User');
const Rating = require('../models/Rating'); //
const mongoose = require('mongoose');

// Função auxiliar para buscar perfil e avaliações
async function getUserProfileData(userId) {
  const user = await User.findById(userId).select('-password'); // Exclui a senha
  if (!user) {
    return null;
  }

  const ratingsReceived = await Rating.find({ ratedUser: userId })
    .populate('rater', 'username profilePictureUrl') // Popula com username e foto do avaliador
    .sort({ createdAt: -1 });

  let averageRating = 0;
  if (ratingsReceived.length > 0) {
    const totalStars = ratingsReceived.reduce((acc, rating) => acc + rating.stars, 0);
    averageRating = totalStars / ratingsReceived.length;
  }

  return {
    user,
    ratingsReceived,
    averageRating: parseFloat(averageRating.toFixed(1)) // Arredonda para 1 casa decimal
  };
}


// @desc    Obtém o perfil do usuário logado
exports.getLoggedInUserProfile = async (req, res) => {
  try {
    const profileData = await getUserProfileData(req.user.id);
    if (!profileData) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }
    res.json(profileData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao buscar perfil do usuário.');
  }
};

// @desc    Obtém o perfil de um usuário por ID
exports.getUserProfileById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({ msg: 'ID de usuário inválido.' });
    }
    const profileData = await getUserProfileData(req.params.userId);
    if (!profileData) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }
    res.json(profileData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao buscar perfil do usuário.');
  }
};


// @desc    Atualiza o perfil do usuário logado
exports.updateUserProfile = async (req, res) => {
  const { username, favoriteGame, profilePictureUrl, bio } = req.body;
  const userId = req.user.id;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }

    // Verificar se o novo username já está em uso por outro usuário
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ msg: 'Nome de usuário já está em uso.' });
      }
      user.username = username;
    }

    if (favoriteGame !== undefined) user.favoriteGame = favoriteGame;
    if (profilePictureUrl !== undefined) user.profilePictureUrl = profilePictureUrl;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    
    // Retorna os dados atualizados do perfil, incluindo avaliações para consistência
    const updatedProfileData = await getUserProfileData(userId);
    res.json({ msg: 'Perfil atualizado com sucesso!', profileData: updatedProfileData });

  } catch (err) {
    console.error(err.message);
    if (err.code === 11000 || err.message.includes('username_1 dup key')) { // Trata erro de username duplicado do MongoDB
        return res.status(400).json({ msg: 'Nome de usuário já está em uso.' });
    }
    res.status(500).send('Erro no servidor ao atualizar perfil.');
  }
};