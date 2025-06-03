const Rating = require('../models/Rating');
const Report = require('../models/Report');
const Lobby = require('../models/Lobby'); // Para verificar o lobby

// @route   POST /api/feedback/rate
// @desc    Salva uma avaliação de usuário
// @access  Private (requer autenticação)
exports.submitRating = async (req, res) => {
  const { ratedUser, lobbyId, stars, comment } = req.body;
  const rater = req.user.id; // Usuário logado

  try {
    // Opcional: Validar se o rater e ratedUser estavam no mesmo lobby
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ msg: 'Lobby não encontrado.' });
    }
    const raterInLobby = lobby.currentPlayers.some(p => p.toString() === rater);
    const ratedUserInLobby = lobby.currentPlayers.some(p => p.toString() === ratedUser);

    if (!raterInLobby || !ratedUserInLobby) {
      return res.status(400).json({ msg: 'Ambos os usuários devem ter participado do lobby para avaliação.' });
    }

    // Opcional: Prevenir múltiplas avaliações do mesmo rater para o mesmo ratedUser no mesmo lobby
    const existingRating = await Rating.findOne({ rater, ratedUser, lobby: lobbyId });
    if (existingRating) {
      return res.status(400).json({ msg: 'Você já avaliou este jogador neste lobby.' });
    }

    const newRating = new Rating({
      rater,
      ratedUser,
      lobby: lobbyId,
      stars,
      comment
    });

    await newRating.save();
    res.status(201).json({ msg: 'Avaliação salva com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao salvar avaliação.');
  }
};

// @route   POST /api/feedback/report
// @desc    Salva uma denúncia de usuário
// @access  Private (requer autenticação)
exports.submitReport = async (req, res) => {
  const { reportedUser, lobbyId, reason } = req.body;
  const reporter = req.user.id; // Usuário logado

  try {
    // Opcional: Validar se o reporter e reportedUser estavam no mesmo lobby
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      return res.status(404).json({ msg: 'Lobby não encontrado.' });
    }
    const reporterInLobby = lobby.currentPlayers.some(p => p.toString() === reporter);
    const reportedUserInLobby = lobby.currentPlayers.some(p => p.toString() === reportedUser);

    if (!reporterInLobby || !reportedUserInLobby) {
      return res.status(400).json({ msg: 'Ambos os usuários devem ter participado do lobby para denúncia.' });
    }

    // Opcional: Prevenir múltiplas denúncias idênticas do mesmo reporter para o mesmo reportedUser no mesmo lobby em um curto período
    const existingReport = await Report.findOne({ reporter, reportedUser, lobby: lobbyId, reason });
    if (existingReport) {
      return res.status(400).json({ msg: 'Você já enviou uma denúncia similar para este jogador neste lobby.' });
    }

    const newReport = new Report({
      reporter,
      reportedUser,
      lobby: lobbyId,
      reason
    });

    await newReport.save();
    res.status(201).json({ msg: 'Denúncia enviada com sucesso! Nossa equipe irá revisar.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao enviar denúncia.');
  }
};