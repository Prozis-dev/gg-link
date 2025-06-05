// client/src/components/LobbyCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './LobbyCard.css';

function LobbyCard({ lobby, onJoin, onLeave, onDelete, currentUserId }) {
  const isOwner = lobby.owner._id === currentUserId;
  const isPlayer = lobby.currentPlayers.some(player => player._id === currentUserId);
  const isFull = lobby.currentPlayers.length >= lobby.maxPlayers;

  return (
    <div className="lobby-card">
      <img src={lobby.imageUrl || 'https://via.placeholder.com/300x150/1a1a2e/e0e0e0?text=Game'} alt={lobby.game} className="lobby-image" />
      <div className="lobby-info">
        {/* Use Link para o nome do lobby para ir para a página do lobby */}
        <h3><Link to={`/lobby/${lobby._id}`}>{lobby.name}</Link> ({lobby.game})</h3>
        <p>Modo: {lobby.mode}</p>
        <p>Descrição: {lobby.description}</p>
        <p>Jogadores: {lobby.currentPlayers.length}/{lobby.maxPlayers}</p>
        <p>Nível de Habilidade: {lobby.skillLevel}</p>
        <p>Criado por: {lobby.owner.username}</p>
        <div className="lobby-players">
          <p>Participantes:</p>
          <ul>
            {lobby.currentPlayers.map(player => (
              <li key={player._id}>{player.username}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="lobby-actions">
        {/* ... (botões de ação existentes) ... */}
        {isOwner ? (
          <button className="btn-delete" onClick={() => onDelete(lobby._id)}>Deletar Lobby</button>
        ) : isPlayer ? (
          <button className="btn-leave" onClick={() => onLeave(lobby._id)}>Sair do Lobby</button>
        ) : (
          <button className="btn-join" onClick={() => onJoin(lobby._id)} disabled={isFull}>
            {isFull ? 'Lobby Cheio' : 'Entrar no Lobby'}
          </button>
        )}
      </div>
    </div>
  );
}

export default LobbyCard;