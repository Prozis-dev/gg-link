import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerOptionsMenu.css';

function PlayerOptionsMenu({ player, onClose, onRate, onReport, onViewProfile }) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const navigate = useNavigate();

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      setMessage('Por favor, dê uma pontuação em estrelas.');
      setMessageType('error');
      return;
    }
    const success = await onRate(player._id, rating, comment, setMessage, setMessageType);
    if (success) {
        setTimeout(() => onClose(), 1500); 
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      setMessage('Por favor, descreva o motivo da denúncia.');
      setMessageType('error');
      return;
    }
    const success = await onReport(player._id, reportReason, setMessage, setMessageType);
     if (success) {
        setTimeout(() => onClose(), 1500); 
    }
  };

  const handleViewProfileClick = () => {
    if (onViewProfile) { 
      onViewProfile(player._id);
    } else { 
      navigate(`/profile/${player._id}`);
      onClose();
    }
  };

  return (
    <div className="player-options-overlay" onClick={onClose}>
      <div className="player-options-menu" onClick={(e) => e.stopPropagation()}>
        <h3>Opções para {player.username}</h3>
        {message && <div className={`message ${messageType}`}>{message}</div>}

        {!showRatingForm && !showReportForm && (
          <div className="initial-options">
            {/* NOVO BOTÃO "VER PERFIL" */}
            <button 
              className="btn-option btn-view-profile" 
              onClick={handleViewProfileClick}
            >
              Ver Perfil
            </button>
            <button className="btn-option" onClick={() => setShowRatingForm(true)}>Avaliar</button>
            <button className="btn-option btn-report-trigger" onClick={() => setShowReportForm(true)}>Denunciar</button>
          </div>
        )}

        {showRatingForm && (
          <div className="rating-form">
            <h4>Avaliar {player.username}</h4>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= rating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  role="button" 
                  tabIndex={0}  
                  onKeyDown={(e) => e.key === 'Enter' && setRating(star)} 
                >
                  &#9733;
                </span>
              ))}
            </div>
            <textarea
              placeholder="Comentários adicionais (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
            ></textarea>
            <div className="form-actions">
              <button className="btn-submit" onClick={handleRatingSubmit}>Enviar Avaliação</button>
              <button className="btn-cancel" onClick={() => { setShowRatingForm(false); setMessage(''); }}>Cancelar</button>
            </div>
          </div>
        )}

        {showReportForm && (
          <div className="report-form">
            <h4>Denunciar {player.username}</h4>
            <textarea
              placeholder="Descreva o motivo da denúncia..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows="5"
              required
            ></textarea>
            <div className="form-actions">
              <button className="btn-submit btn-report-submit" onClick={handleReportSubmit}>Enviar Denúncia</button>
              <button className="btn-cancel" onClick={() => { setShowReportForm(false); setMessage(''); }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerOptionsMenu;