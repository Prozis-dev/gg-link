import React, { useState } from 'react';
import './CreateLobbyModal.css'; // Crie este CSS

function CreateLobbyModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    game: '',
    mode: '',
    description: '',
    maxPlayers: 2, // Default para mínimo de jogadores
    skillLevel: 'Qualquer',
    imageUrl: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica
    if (!formData.name || !formData.game || !formData.mode || !formData.maxPlayers) {
      setMessage('Nome, Jogo, Modo e Capacidade Máxima são obrigatórios.');
      setMessageType('error');
      return;
    }
    if (formData.maxPlayers < 2 || formData.maxPlayers > 10) {
      setMessage('A capacidade máxima deve ser entre 2 e 10 jogadores.');
      setMessageType('error');
      return;
    }

    const token = localStorage.getItem('gglink_token');
    if (!token) {
      setMessage('Você precisa estar logado para criar um lobby.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/lobbies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg || 'Lobby criado com sucesso!');
        setMessageType('success');
        // Resetar formulário
        setFormData({
          name: '',
          game: '',
          mode: '',
          description: '',
          maxPlayers: 2,
          skillLevel: 'Qualquer',
          imageUrl: ''
        });
        // Chamar a função para atualizar a lista no Dashboard e fechar o modal
        setTimeout(() => {
          onCreate();
          setMessage(''); // Limpa mensagem após fechar
        }, 1500);
      } else {
        setMessage(data.msg || 'Erro ao criar lobby.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro de rede ao criar lobby:', error);
      setMessage('Erro de conexão. Tente novamente mais tarde.');
      setMessageType('error');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Criar Novo Lobby</h2>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome do Lobby</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="game">Nome do Jogo</label>
            <input
              type="text"
              id="game"
              name="game"
              value={formData.game}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="mode">Modo de Jogo</label>
            <input
              type="text"
              id="mode"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Breve Descrição</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="maxPlayers">Capacidade Máxima de Jogadores</label>
            <input
              type="number"
              id="maxPlayers"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleChange}
              min="2"
              max="10"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="skillLevel">Nível de Habilidade Desejado</label>
            <select
              id="skillLevel"
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
            >
              <option value="Qualquer">Qualquer</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
              <option value="Pro">Pro</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">URL da Imagem (Opcional)</label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-auth">Confirmar Criação</button>
        </form>
      </div>
    </div>
  );
}

export default CreateLobbyModal;