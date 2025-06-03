import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../styles/LobbyPage.css'; // Vamos criar este CSS

const ENDPOINT = 'http://localhost:5000'; // Endereço do seu backend Socket.IO

function LobbyPage() {
  const { id: lobbyId } = useParams(); // Pega o ID do lobby da URL
  const navigate = useNavigate();
  const [lobbyDetails, setLobbyDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentPlayers, setCurrentPlayers] = useState([]); // Lista de integrantes
  const messagesEndRef = useRef(null); // Ref para scroll automático
  const socketRef = useRef(null); // Ref para a instância do socket

  // Função para rolar o chat para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // 1. Conectar ao Socket.IO com o token
    socketRef.current = io(ENDPOINT, {
      auth: {
        token: token
      }
    });

    // Eventos do Socket.IO
    socketRef.current.on('connect', () => {
      console.log('Conectado ao Socket.IO!');
      socketRef.current.emit('joinLobby', lobbyId); // Entra na sala do lobby
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error.message);
      alert('Não foi possível conectar ao chat. Tente novamente mais tarde.');
      navigate('/dashboard'); // Redireciona em caso de erro de conexão
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
      // Refresque a lista de jogadores (você precisará de um endpoint ou emitir lista completa)
      fetchLobbyDetails(); // Atualiza a lista de players
    });

    socketRef.current.on('userLeftLobby', (data) => {
      console.log(data.message);
      setMessages((prevMessages) => [...prevMessages, {
        username: 'Sistema',
        message: data.message,
        timestamp: new Date().toISOString()
      }]);
      // Refresque a lista de jogadores
      fetchLobbyDetails(); // Atualiza a lista de players
    });

    socketRef.current.on('lobbyClosed', (data) => {
      alert(`Lobby ${data.lobbyName} foi fechado pelo criador.`);
      navigate('/dashboard'); // Redireciona para o dashboard
    });

    socketRef.current.on('lobbyError', (errorMsg) => {
      console.error('Erro do lobby via Socket:', errorMsg);
      alert(`Erro no lobby: ${errorMsg}`);
    });

    // 2. Buscar detalhes do lobby via API REST
    const fetchLobbyDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/lobbies?_id=${lobbyId}`, { // Buscar por ID
          headers: {
            'x-auth-token': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setLobbyDetails(data[0]);
            setCurrentPlayers(data[0].currentPlayers); // Inicializa a lista de players
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

    // Limpeza ao desmontar o componente
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveLobby', lobbyId); // Avisa ao servidor que está saindo
        socketRef.current.disconnect();
      }
    };
  }, [lobbyId, navigate]); // Dependências: lobbyId para re-executar se o lobby mudar, navigate para redirecionar

  // Rola para o final do chat sempre que novas mensagens chegam
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
          socketRef.current.emit('leaveLobby', lobbyId); // Notifica o socket
          socketRef.current.disconnect();
        }
        navigate('/dashboard');
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
          // Emitir evento para todos os usuários do lobby avisando do fechamento
          socketRef.current.emit('lobbyClosed', { lobbyId, lobbyName: lobbyDetails?.name });
          socketRef.current.disconnect();
        }
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        alert(`Erro ao fechar lobby: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao fechar lobby:', error);
      alert('Erro de conexão ao tentar fechar o lobby.');
    }
  };

  if (!lobbyDetails) {
    return (
      <div className="lobby-loading">
        <p>Carregando lobby...</p>
      </div>
    );
  }

  // Obter o ID do usuário logado para verificar se é o criador
  const currentUserId = localStorage.getItem('gglink_token') ?
    JSON.parse(atob(localStorage.getItem('gglink_token').split('.')[1])).user.id : null;
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
            <div ref={messagesEndRef} /> {/* Para scroll automático */}
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
                <li key={player._id}>{player.username} {player._id === lobbyDetails.owner._id && '(Criador)'}</li>
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
    </div>
  );
}

export default LobbyPage;