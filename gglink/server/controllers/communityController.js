const Community = require('../models/Community');
const User = require('../models/User'); // Para popular dados de membros

// @route   GET /api/communities
// @desc    Lista todas as comunidades
// @access  Private (requer autenticação)
exports.getCommunities = async (req, res) => {
  try {
    const communities = await Community.find().sort({ name: 1 });
    res.json(communities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao buscar comunidades.');
  }
};

// @route   GET /api/communities/:id
// @desc    Obtém detalhes de uma comunidade específica
// @access  Private
exports.getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate('members', 'username');
    if (!community) {
      return res.status(404).json({ msg: 'Comunidade não encontrada.' });
    }
    res.json(community);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao buscar detalhes da comunidade.');
  }
};

// @route   PUT /api/communities/:id/join
// @desc    Entrar em uma comunidade
// @access  Private
exports.joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ msg: 'Comunidade não encontrada.' });
    }

    // Verificar se o usuário já é membro
    if (community.members.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Você já é membro desta comunidade.' });
    }

    community.members.push(req.user.id);
    await community.save();
    res.json({ msg: 'Você entrou na comunidade!', community });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao entrar na comunidade.');
  }
};

// @route   PUT /api/communities/:id/leave
// @desc    Sair de uma comunidade
// @access  Private
exports.leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ msg: 'Comunidade não encontrada.' });
    }

    // Verificar se o usuário é membro
    if (!community.members.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Você não é membro desta comunidade.' });
    }

    community.members = community.members.filter(
      (member) => member.toString() !== req.user.id
    );
    await community.save();
    res.json({ msg: 'Você saiu da comunidade!', community });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao sair da comunidade.');
  }
};