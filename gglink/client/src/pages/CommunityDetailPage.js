import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import PlayerOptionsMenu from '../components/PlayerOptionsMenu'; 
import '../styles/CommunityDetailPage.css'; 

const ENDPOINT = 'http://localhost:5000';

function CommunityDetailPage() {
  const { id: communityId } = useParams();
  const navigate = useNavigate();
  const [communityDetails, setCommunityDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentMembers, setCurrentMembers] = useState([]); 
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const [showPlayerOptionsMenu, setShowPlayerOptionsMenu] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

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
      console.log('Conectado ao Socket.IO da Comunidade!');
      socketRef.current.emit('joinCommunity', communityId); 
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO na Comunidade:', error.message);
      alert('Não foi possível conectar ao chat da comunidade.');
    });

    socketRef.current.on('receiveCommunityMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketRef.current.on('communityUserJoined', (data) => {
      console.log(data.message);
      setMessages((prevMessages) => [...prevMessages, {
        username: 'Sistema',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
      fetchCommunityDetails(); 
    });

    socketRef.current.on('communityUserLeft', (data) => {
      console.log(data.message);
      setMessages((prevMessages) => [...prevMessages, {
        username: 'Sistema',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
      fetchCommunityDetails();
    });

    socketRef.current.on('communityError', (errorMsg) => {
      console.error('Erro da comunidade via Socket:', errorMsg);
      alert(`Erro na comunidade: ${errorMsg}`);
    });


    const fetchCommunityDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/communities/${communityId}`, {
          headers: {
            'x-auth-token': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCommunityDetails(data);
          setCurrentMembers(data.members); 
        } else {
          console.error('Falha ao buscar detalhes da comunidade:', response.statusText);
          alert('Não foi possível carregar os detalhes da comunidade.');
          navigate('/communities'); 
        }
      } catch (error) {
        console.error('Erro de rede ao buscar detalhes da comunidade:', error);
        alert('Erro de conexão ao carregar comunidade.');
        navigate('/communities');
      }
    };

    fetchCommunityDetails();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveCommunity', communityId); 
        socketRef.current.disconnect();
      }
    };
  }, [communityId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendCommunityMessage', { communityId, message: messageInput });
      setMessageInput('');
    }
  };

  const handleJoinCommunity = async () => {
    const token = localStorage.getItem('gglink_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/communities/${communityId}/join`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        alert('Você entrou na comunidade!');
        fetchCommunityDetails();
      } else {
        const errorData = await response.json();
        alert(`Erro ao entrar na comunidade: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao entrar na comunidade:', error);
      alert('Erro de conexão ao tentar entrar na comunidade.');
    }
  };

  const handleLeaveCommunity = async () => {
    if (!window.confirm('Tem certeza que deseja sair desta comunidade?')) {
      return;
    }

    const token = localStorage.getItem('gglink_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/communities/${communityId}/leave`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        alert('Você saiu da comunidade!');
        if (socketRef.current) {
          socketRef.current.emit('leaveCommunity', communityId);
          socketRef.current.disconnect();
        }
        navigate('/communities'); 
      } else {
        const errorData = await response.json();
        alert(`Erro ao sair da comunidade: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao sair da comunidade:', error);
      alert('Erro de conexão ao tentar sair da comunidade.');
    }
  };

  const handlePlayerClick = (player) => {
    if (player._id === currentUserId) {
        return; 
    }
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
            body: JSON.stringify({ ratedUser: ratedUserId, lobbyId: null, 
                                   stars, comment }),
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
            body: JSON.stringify({ reportedUser: reportedUserId, lobbyId: null, 
                                   reason }),
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


  if (!communityDetails) {
    return (
      <div className="community-loading">
        <p>Carregando comunidade...</p>
      </div>
    );
  }

  const isMember = communityDetails.members.some(member => member._id === currentUserId);

  return (
    <div className="community-detail-page-container">
      <header className="community-detail-header" style={{ backgroundImage: `url(${communityDetails.imageUrl})` }}>
        <div className="header-overlay">
          <div className="container">
            <h2 className="community-name">{communityDetails.name}</h2>
            <p className="community-description">{communityDetails.description}</p>
            {!isMember ? (
              <button className="btn-join-community" onClick={handleJoinCommunity}>Entrar na Comunidade</button>
            ) : (
              <button className="btn-leave-community" onClick={handleLeaveCommunity}>Sair da Comunidade</button>
            )}
          </div>
        </div>
      </header>

      <main className="community-detail-main-content container">
        <div className="chat-section">
          <h3>Chat da Comunidade</h3>
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
          {isMember ? (
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
          ) : (
            <p className="chat-join-message">Junte-se à comunidade para participar do chat!</p>
          )}
        </div>

        <div className="community-sidebar">
          <div className="members-list">
            <h3>Membros Online ({currentMembers.length})</h3>
            <ul>
              {currentMembers.map(member => (
                <li
                  key={member._id}
                  onClick={() => handlePlayerClick(member)}
                  className={member._id !== currentUserId ? 'clickable-player' : ''}
                  title={member._id !== currentUserId ? `Clique para avaliar/denunciar ${member.username}` : ''}
                >
                  {member.username}
                </li>
              ))}
            </ul>
          </div>
          {/* Opcional: Seção de Eventos/Marcar Partidas */}
          <div className="events-section">
            <h3>Próximos Eventos</h3>
            <p>Em breve, eventos e funcionalidades para marcar partidas!</p>
            {/* Adicione lógica para listar eventos aqui */}
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
          lobbyId={null} 
          currentUserId={currentUserId}
          onClose={() => setShowPlayerOptionsMenu(false)}
          onRate={handleRatePlayer}
          onReport={handleReportPlayer}
        />
      )}
    </div>
  );
}

export default CommunityDetailPage;