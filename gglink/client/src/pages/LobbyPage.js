import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import PlayerOptionsMenu from '../components/PlayerOptionsMenu'; // Importe o novo componente
import '../styles/LobbyPage.css';

const ENDPOINT = 'http://localhost:5000';

function LobbyPage() {
  const { id: lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobbyDetails, setLobbyDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentPlayers, setCurrentPlayers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const [showPlayerOptionsMenu, setShowPlayerOptionsMenu] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null); // O jogador clicado para avaliação/denúncia

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentUserId = localStorage.getItem('gglink_token') ?
    JSON.parse(atob(localStorage.getItem('gglink_token').split('.')[1])).user.id : null;

  useEffect(() => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      navigate('/login');
      return;
    }

    socketRef.current = io(ENDPOINT, {
      auth: {
        token: token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Conectado ao Socket.IO!');
      socketRef.current.emit('joinLobby', lobbyId);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error.message);
      alert('Não foi possível conectar ao chat. Tente novamente mais tarde.');
      navigate('/dashboard');
    });

    socketRef.current.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketRef.current.on('userJoinedLobby', (data) => {
      console.log(data.message);
      setMessages((prevMessages) => [...prevMessages, {
        username: 'Sistema',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
      fetchLobbyDetails();
    });

    socketRef.current.on('userLeftLobby', (data) => {
      console.log(data.message);
      setMessages((prevMessages) => [...prevMessages, {
        username: 'Sistema',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
      fetchLobbyDetails();
    });

    socketRef.current.on('lobbyClosed', (data) => {
      alert(`Lobby "${data.lobbyName}" foi fechado pelo criador.`);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      navigate('/dashboard'); // Redireciona diretamente
    });

    socketRef.current.on('lobbyError', (errorMsg) => {
      console.error('Erro do lobby via Socket:', errorMsg);
      alert(`Erro no lobby: ${errorMsg}`);
    });

    const fetchLobbyDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/lobbies?_id=${lobbyId}`, {
          headers: {
            'x-auth-token': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setLobbyDetails(data[0]);
            setCurrentPlayers(data[0].currentPlayers);
          } else {
            alert('Lobby não encontrado ou você não tem acesso.');
            navigate('/dashboard');
          }
        } else {
          console.error('Falha ao buscar detalhes do lobby:', response.statusText);
          alert('Não foi possível carregar os detalhes do lobby.');
          navigate('/dashboard');
        }
      } catch (error) {
          console.error('Erro de rede ao buscar detalhes do lobby:', error);
          alert('Erro de conexão ao carregar lobby.');
          navigate('/dashboard');
      }
    };

    fetchLobbyDetails();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveLobby', lobbyId);
        socketRef.current.disconnect();
      }
    };
  }, [lobbyId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', { lobbyId, message: messageInput });
      setMessageInput('');
    }
  };

  const handleLeaveLobby = async () => {
    if (!window.confirm('Tem certeza que deseja sair deste lobby?')) {
      return;
    }

    const token = localStorage.getItem('gglink_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/lobbies/${lobbyId}/leave`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        alert('Você saiu do lobby!');
        if (socketRef.current) {
          socketRef.current.emit('leaveLobby', lobbyId);
          socketRef.current.disconnect();
        }
        navigate('/dashboard'); // Redireciona diretamente para o dashboard
      } else {
        const errorData = await response.json();
        alert(`Erro ao sair do lobby: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao sair do lobby:', error);
      alert('Erro de conexão ao tentar sair do lobby.');
    }
  };

  const handleCloseLobby = async () => {
    if (!window.confirm('Tem certeza que deseja fechar este lobby? Essa ação é irreversível.')) {
      return;
    }

    const token = localStorage.getItem('gglink_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/lobbies/${lobbyId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        alert('Lobby fechado com sucesso!');
        if (socketRef.current) {
          socketRef.current.emit('lobbyClosed', { lobbyId, lobbyName: lobbyDetails?.name });
          socketRef.current.disconnect();
        }
        navigate('/dashboard'); // Redireciona diretamente
      } else {
        const errorData = await response.json();
        alert(`Erro ao fechar lobby: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao fechar lobby:', error);
      alert('Erro de conexão ao tentar fechar o lobby.');
    }
  };

  const handlePlayerClick = (player) => {
    // Não permite avaliar/denunciar a si mesmo ou o criador se ele não for um player avaliável
    if (player._id === currentUserId) {
        return; // Não permite clicar no próprio perfil para avaliar/denunciar
    }
    // Opcional: Impedir que o criador seja avaliado se ele for o único player
    // if (lobbyDetails.owner._id === player._id && lobbyDetails.currentPlayers.length === 1) {
    //   return;
    // }
    setSelectedPlayer(player);
    setShowPlayerOptionsMenu(true);
  };

  const handleRatePlayer = async (ratedUserId, stars, comment, setMessageCallback, setMessageTypeCallback) => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
        setMessageCallback('Você precisa estar logado para avaliar.');
        setMessageTypeCallback('error');
        return false;
    }

    try {
        const response = await fetch('http://localhost:5000/api/feedback/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ ratedUser: ratedUserId, lobbyId: lobbyId, stars, comment }),
        });

        const data = await response.json();
        if (response.ok) {
            setMessageCallback(data.msg || 'Avaliação enviada com sucesso!');
            setMessageTypeCallback('success');
            return true;
        } else {
            setMessageCallback(data.msg || 'Erro ao enviar avaliação.');
            setMessageTypeCallback('error');
            return false;
        }
    } catch (error) {
        console.error('Erro de rede ao enviar avaliação:', error);
        setMessageCallback('Erro de conexão ao enviar avaliação.');
        setMessageTypeCallback('error');
        return false;
    }
  };

  const handleReportPlayer = async (reportedUserId, reason, setMessageCallback, setMessageTypeCallback) => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
        setMessageCallback('Você precisa estar logado para denunciar.');
        setMessageTypeCallback('error');
        return false;
    }

    try {
        const response = await fetch('http://localhost:5000/api/feedback/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ reportedUser: reportedUserId, lobbyId: lobbyId, reason }),
        });

        const data = await response.json();
        if (response.ok) {
            setMessageCallback(data.msg || 'Denúncia enviada com sucesso!');
            setMessageTypeCallback('success');
            return true;
        } else {
            setMessageCallback(data.msg || 'Erro ao enviar denúncia.');
            setMessageTypeCallback('error');
            return false;
        }
    } catch (error) {
        console.error('Erro de rede ao enviar denúncia:', error);
        setMessageCallback('Erro de conexão ao enviar denúncia.');
        setMessageTypeCallback('error');
        return false;
    }
  };

  if (!lobbyDetails) {
    return (
      <div className="lobby-loading">
        <p>Carregando lobby...</p>
      </div>
    );
  }

  const isOwner = lobbyDetails.owner._id === currentUserId;

  return (
    <div className="lobby-page-container">
      <header className="lobby-header">
        <div className="container">
          <h2 className="lobby-title">{lobbyDetails.name} <span className="game-name">({lobbyDetails.game})</span></h2>
          <span className="owner-info">Criado por: {lobbyDetails.owner.username}</span>
        </div>
      </header>

      <main className="lobby-main-content container">
        <div className="chat-section">
          <h3>Chat do Lobby</h3>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.userId === currentUserId ? 'own-message' : ''}`}>
                <span className="message-sender">{msg.username}: </span>
                <span className="message-text">{msg.message}</span>
                <span className="message-timestamp"> {new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              aria-label="Campo de mensagem do chat"
            />
            <button type="submit" className="btn-send-message">Enviar</button>
          </form>
        </div>

        <div className="lobby-sidebar">
          <div className="players-list">
            <h3>Integrantes ({currentPlayers.length}/{lobbyDetails.maxPlayers})</h3>
            <ul>
              {currentPlayers.map(player => (
                <li
                  key={player._id}
                  onClick={() => handlePlayerClick(player)} // Adiciona o evento de clique
                  className={player._id !== currentUserId ? 'clickable-player' : ''} // Estilo para clicáveis
                  title={player._id !== currentUserId ? `Clique para avaliar/denunciar ${player.username}` : ''}
                >
                  {player.username} {player._id === lobbyDetails.owner._id && '(Criador)'}
                </li>
              ))}
            </ul>
          </div>
          <div className="lobby-actions-sidebar">
            <button className="btn-leave-lobby" onClick={handleLeaveLobby}>Sair do Lobby</button>
            {isOwner && (
              <button className="btn-close-lobby" onClick={handleCloseLobby}>Fechar Lobby</button>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 GGLink. Todos os direitos reservados.</p>
        </div>
      </footer>

      {showPlayerOptionsMenu && selectedPlayer && (
        <PlayerOptionsMenu
          player={selectedPlayer}
          lobbyId={lobbyId} // Passa o ID do lobby
          currentUserId={currentUserId}
          onClose={() => setShowPlayerOptionsMenu(false)}
          onRate={handleRatePlayer}
          onReport={handleReportPlayer}
        />
      )}
    </div>
  );
}

export default LobbyPage;