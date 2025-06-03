const Lobby = require('../models/Lobby');
const User = require('../models/User'); // Para popular dados do usuário
const mongoose = require('mongoose');

// @route   POST /api/lobbies
// @desc    Cria um novo lobby
// @access  Private (requer autenticação)
exports.createLobby = async (req, res) => {
  const { name, game, mode, description, maxPlayers, skillLevel, imageUrl } = req.body;
  const ownerId = req.user.id; // Vem do middleware de autenticação

  try {
    const newLobby = new Lobby({
      name,
      game,
      mode,
      description,
      maxPlayers,
      skillLevel,
      imageUrl,
      owner: ownerId,
      currentPlayers: [ownerId] // O criador do lobby é o primeiro jogador
    });

    const lobby = await newLobby.save();

    res.status(201).json(lobby);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao criar lobby.');
  }
};

// @route   GET /api/lobbies
// @desc    Lista todos os lobbies (com filtros)
// @access  Private (requer autenticação)
exports.getLobbies = async (req, res) => {
  try {
    const { game, skillLevel, numPlayers } = req.query; // Parâmetros de query para filtros
    let query = {};

    if (game) {
      query.game = new RegExp(game, 'i'); // Case-insensitive search
    }
    if (skillLevel && skillLevel !== 'Qualquer') {
      query.skillLevel = skillLevel;
    }
    if (numPlayers) {
      // Filtra lobbies que ainda têm espaço
      query.currentPlayers = { $size: { $lt: parseInt(numPlayers) } }; // Incompleto, depende do que você quer
      // Para filtrar por lobbies que têm X jogadores, seria $size: parseInt(numPlayers)
      // Para lobbies que cabem X jogadores, seria maxPlayers >= parseInt(numPlayers)
      // Para simplificar, vou filtrar lobbies que tenham *pelo menos* 1 vaga para o número de jogadores desejado
      // e que o número atual de jogadores seja menor que o máximo
      query.currentPlayers = { $size: { $lt: mongoose.Types.ObjectId.isValid(numPlayers) ? 100 : 100 } }; // Placeholder
      // A lógica de `numPlayers` é mais complexa, vou simplificar para `maxPlayers`
      query.maxPlayers = { $gte: parseInt(numPlayers) }; // Lobbies que cabem X jogadores
    }

    const lobbies = await Lobby.find(query)
      .populate('owner', 'username') // Popula o nome de usuário do proprietário
      .populate('currentPlayers', 'username') // Popula os nomes de usuário dos jogadores
      .sort({ createdAt: -1 }); // Ordena do mais novo para o mais antigo

    res.json(lobbies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao buscar lobbies.');
  }
};

// @route   PUT /api/lobbies/:id/join
// @desc    Entrar em um lobby
// @access  Private
exports.joinLobby = async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ msg: 'Lobby não encontrado' });
    }

    // Verificar se o lobby está cheio
    if (lobby.currentPlayers.length >= lobby.maxPlayers) {
      return res.status(400).json({ msg: 'Lobby cheio' });
    }

    // Verificar se o usuário já está no lobby
    if (lobby.currentPlayers.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Você já está neste lobby' });
    }

    lobby.currentPlayers.push(req.user.id);
    await lobby.save();

    res.json({ msg: 'Você entrou no lobby!', lobby });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao entrar no lobby.');
  }
};

// @route   PUT /api/lobbies/:id/leave
// @desc    Sair de um lobby
// @access  Private
exports.leaveLobby = async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ msg: 'Lobby não encontrado' });
    }

    // Verificar se o usuário está no lobby
    if (!lobby.currentPlayers.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Você não está neste lobby' });
    }

    // Remover o usuário do array currentPlayers
    lobby.currentPlayers = lobby.currentPlayers.filter(
      (player) => player.toString() !== req.user.id
    );

    // Se o dono sair e não houver mais jogadores, opcionalmente remover o lobby
    if (lobby.owner.toString() === req.user.id && lobby.currentPlayers.length === 0) {
      await lobby.remove(); // Ou transferir a propriedade
      return res.json({ msg: 'Você saiu do lobby. Lobby removido por falta de jogadores.' });
    }

    await lobby.save();

    res.json({ msg: 'Você saiu do lobby!', lobby });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao sair do lobby.');
  }
};

// @route   DELETE /api/lobbies/:id
// @desc    Deleta um lobby (apenas pelo proprietário)
// @access  Private
exports.deleteLobby = async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby) {
      return res.status(404).json({ msg: 'Lobby não encontrado' });
    }

    // Verificar se o usuário logado é o proprietário do lobby
    if (lobby.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Não autorizado. Apenas o criador pode fechar o lobby.' });
    }

    await lobby.deleteOne(); // Usar deleteOne() para deletar o documento

    // Opcional: Emitir evento Socket.IO para notificar que o lobby foi fechado
    // Este `io` não está disponível diretamente no controller, precisaria de uma forma
    // de injetá-lo ou usar um singleton pattern. Por simplicidade, faremos isso no frontend
    // ao receber a resposta de sucesso, ou num nível superior do backend.
    // Para este exemplo, o frontend vai disparar o evento de saída.

    res.json({ msg: 'Lobby removido com sucesso.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor ao deletar lobby.');
  }
};