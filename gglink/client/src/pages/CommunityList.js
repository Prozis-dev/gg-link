import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/CommunityList.css'; // Crie este CSS

function CommunityList() {
  const [communities, setCommunities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchCommunities = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/communities', {
          headers: {
            'x-auth-token': token,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCommunities(data);
        } else {
          console.error('Falha ao buscar comunidades:', response.statusText);
          setCommunities([]);
        }
      } catch (error) {
        console.error('Erro de rede ao buscar comunidades:', error);
        setCommunities([]);
      }
    };

    fetchCommunities();
  }, [navigate]);

  return (
    <div className="community-list-container">
      <header className="community-list-header">
        <div className="container">
          <h2>Comunidades GGLink</h2>
          <p>Conecte-se com jogadores dos seus jogos favoritos!</p>
        </div>
      </header>

      <main className="community-list-main-content container">
        <div className="community-grid">
          {communities.length === 0 ? (
            <p>Nenhuma comunidade encontrada.</p>
          ) : (
            communities.map(community => (
              <div className="community-card" key={community._id}>
                <img src={community.imageUrl} alt={community.name} className="community-image" />
                <div className="community-info">
                  <h3>{community.name}</h3>
                  <p>{community.description}</p>
                  <p>Membros: {community.members.length}</p>
                  <Link to={`/community/${community._id}`} className="btn-view-community">Ver Comunidade</Link>
                </div>
              </div>
            ))
          )}
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

export default CommunityList;