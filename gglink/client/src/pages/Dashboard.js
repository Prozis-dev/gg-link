import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateLobbyModal from '../components/CreateLobbyModal'; // Vamos criar este componente
import LobbyCard from '../components/LobbyCard'; // Vamos criar este componente
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [filters, setFilters] = useState({
    game: '',
    skillLevel: 'Qualquer',
    numPlayers: ''
  });
  const [userName, setUserName] = useState(''); // Estado para o nome do usuário logado

  useEffect(() => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Em uma aplicação real, você decodificaria o JWT para pegar o nome do usuário
    // ou faria uma requisição para um endpoint /api/user/me
    // Por enquanto, vamos mockar ou decodificar um token simples para teste.
    // Exemplo Simples:
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const userPayload = JSON.parse(jsonPayload);
    // Para obter o username real, você precisaria de um endpoint no backend ou incluir o username no token.
    // Por enquanto, vamos assumir que o user.id é o username (para fins de exibição).
    setUserName(`Usuário ${userPayload.user.id.substring(0, 8)}...`); // Apenas um placeholder

    fetchLobbies(filters); // Busca lobbies ao carregar a página
  }, [navigate]);

  const fetchLobbies = async (currentFilters) => {
    const token = localStorage.getItem('gglink_token');
    if (!token) return;

    let queryString = new URLSearchParams(currentFilters).toString();
    queryString = queryString.replace(/\+/g, '%20'); // Ajusta espaços em branco na URL

    try {
      const response = await fetch(`http://localhost:5000/api/lobbies?${queryString}`, {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLobbies(data);
      } else {
        console.error('Falha ao buscar lobbies:', response.statusText);
        setLobbies([]);
      }
    } catch (error) {
      console.error('Erro de rede ao buscar lobbies:', error);
      setLobbies([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gglink_token');
    navigate('/login');
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    fetchLobbies(filters);
  };

  const handleResetFilters = () => {
    const reset = {
      game: '',
      skillLevel: 'Qualquer',
      numPlayers: ''
    };
    setFilters(reset);
    fetchLobbies(reset); // Busca lobbies sem filtros
  };

  const handleLobbyCreated = () => {
    setIsModalOpen(false); // Fecha o modal
    fetchLobbies(filters); // Atualiza a lista de lobbies
  };

  const handleJoinLobby = async (lobbyId) => {
    const token = localStorage.getItem('gglink_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/lobbies/${lobbyId}/join`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        alert('Você entrou no lobby!');
        fetchLobbies(filters); // Atualiza a lista
        navigate(`/lobby/${lobbyId}`);
      } else {
        const errorData = await response.json();
        alert(`Erro ao entrar no lobby: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao entrar no lobby:', error);
      alert('Erro de conexão ao tentar entrar no lobby.');
    }
  };

  const handleLeaveLobby = async (lobbyId) => {
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
        fetchLobbies(filters); // Atualiza a lista
      } else {
        const errorData = await response.json();
        alert(`Erro ao sair do lobby: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao sair do lobby:', error);
      alert('Erro de conexão ao tentar sair do lobby.');
    }
  };

  const handleDeleteLobby = async (lobbyId) => {
    if (!window.confirm('Tem certeza que deseja deletar este lobby?')) {
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
        alert('Lobby deletado com sucesso!');
        fetchLobbies(filters); // Atualiza a lista
      } else {
        const errorData = await response.json();
        alert(`Erro ao deletar lobby: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Erro de rede ao deletar lobby:', error);
      alert('Erro de conexão ao tentar deletar o lobby.');
    }
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-main-content container">
        <section className="lobby-search-filter">
          <h3>Encontrar Lobbies</h3>
          <div className="filter-controls">
            <input
              type="text"
              name="game"
              placeholder="Nome do Jogo"
              value={filters.game}
              onChange={handleFilterChange}
            />
            <select
              name="skillLevel"
              value={filters.skillLevel}
              onChange={handleFilterChange}
            >
              <option value="Qualquer">Nível de Habilidade</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
              <option value="Pro">Pro</option>
            </select>
            <input
              type="number"
              name="numPlayers"
              placeholder="Vagas mínimas (2-10)"
              value={filters.numPlayers}
              onChange={handleFilterChange}
              min="2"
              max="10"
            />
            <button className="btn-primary" onClick={handleApplyFilters}>Aplicar Filtros</button>
            <button className="btn-secondary" onClick={handleResetFilters}>Limpar Filtros</button>
          </div>
        </section>

        <section className="lobby-list">
          <h3>Lobbies Disponíveis</h3>
          {lobbies.length === 0 ? (
            <p>Nenhum lobby encontrado. Que tal criar um?</p>
          ) : (
            <div className="lobby-grid">
              {lobbies.map(lobby => (
                <LobbyCard
                  key={lobby._id}
                  lobby={lobby}
                  onJoin={handleJoinLobby}
                  onLeave={handleLeaveLobby}
                  onDelete={handleDeleteLobby}
                  currentUserId={JSON.parse(atob(localStorage.getItem('gglink_token').split('.')[1])).user.id}
                />
              ))}
            </div>
          )}
        </section>

        <button className="btn-create-lobby" onClick={() => setIsModalOpen(true)}>
          Criar Novo Lobby
        </button>
      </main>

      <CreateLobbyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleLobbyCreated} />

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 GGLink. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;