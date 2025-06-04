import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ProfilePage.css'; // Criaremos este CSS

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingGame, setIsEditingGame] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPic, setIsEditingPic] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    favoriteGame: '',
    bio: '',
    profilePictureUrl: ''
  });

  const navigate = useNavigate();
  const { userId: pathUserId } = useParams(); // Para visualizar perfis de outros usuários, se implementado

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('gglink_token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload).user.id;
    } catch (e) { return null; }
  };
  
  const loggedInUserId = getUserIdFromToken();
  const effectiveUserId = pathUserId || loggedInUserId; // Usa o ID da URL se presente, senão o do usuário logado
  const isOwnProfile = effectiveUserId === loggedInUserId;


  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Decide qual endpoint usar
    const endpoint = pathUserId ? `/api/users/profile/${pathUserId}` : '/api/users/me';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();

      if (response.ok) {
        setProfileData(data.user);
        setRatings(data.ratingsReceived || []);
        setAverageRating(data.averageRating || 0);
        setFormData({
          username: data.user.username,
          favoriteGame: data.user.favoriteGame || '',
          bio: data.user.bio || '',
          profilePictureUrl: data.user.profilePictureUrl || ''
        });
      } else {
        setError(data.msg || 'Erro ao carregar perfil.');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar perfil.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, pathUserId]);

  useEffect(() => {
    if (effectiveUserId) {
      fetchProfileData();
    } else if (!pathUserId) { // Se não há ID na URL e não conseguiu pegar do token (não deveria acontecer se a rota é protegida)
        navigate('/login');
    }
  }, [effectiveUserId, fetchProfileData, navigate, pathUserId]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditToggle = (field) => {
    if (field === 'username') setIsEditingUsername(!isEditingUsername);
    if (field === 'game') setIsEditingGame(!isEditingGame);
    if (field === 'bio') setIsEditingBio(!isEditingBio);
    if (field === 'pic') setIsEditingPic(!isEditingPic);
    // Resetar formData para os valores atuais do perfil ao abrir o formulário de edição
    if (profileData) {
        setFormData({
            username: profileData.username,
            favoriteGame: profileData.favoriteGame || '',
            bio: profileData.bio || '',
            profilePictureUrl: profileData.profilePictureUrl || ''
        });
    }
  };

  const handleSubmit = async (field) => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    let payload = {};
    if (field === 'username') payload.username = formData.username;
    if (field === 'game') payload.favoriteGame = formData.favoriteGame;
    if (field === 'bio') payload.bio = formData.bio;
    if (field === 'pic') payload.profilePictureUrl = formData.profilePictureUrl;
    
    // Validação simples
    if (field === 'username' && (!formData.username || formData.username.length < 3)) {
        alert('Nome de usuário deve ter pelo menos 3 caracteres.');
        return;
    }
    if (field === 'pic' && formData.profilePictureUrl && !formData.profilePictureUrl.startsWith('http')) {
        alert('URL da foto de perfil inválida.');
        return;
    }


    try {
      const response = await fetch('http://localhost:5000/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.msg || 'Perfil atualizado!');
        setProfileData(data.profileData.user); // Atualiza com os dados retornados pelo backend
         setRatings(data.profileData.ratingsReceived || []);
         setAverageRating(data.profileData.averageRating || 0);
        if (field === 'username') setIsEditingUsername(false);
        if (field === 'game') setIsEditingGame(false);
        if (field === 'bio') setIsEditingBio(false);
        if (field === 'pic') setIsEditingPic(false);
        // Atualizar nome de usuário na Navbar se ele mudou
        if (field === 'username' && profileData && formData.username !== profileData.username) {
            window.dispatchEvent(new Event('authChange')); // Dispara evento para Navbar atualizar
        }
      } else {
        alert(`Erro: ${data.msg || 'Não foi possível atualizar o perfil.'}`);
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar perfil.');
      console.error(err);
    }
  };

  if (isLoading) return <div className="profile-loading">Carregando perfil...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profileData) return <div className="profile-error">Perfil não encontrado.</div>;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <>
        {'★'.repeat(fullStars)}
        {halfStar && '½'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  return (
    <div className="profile-page-container">
      <header className="profile-header">
        <div className="profile-banner">
          {/* Pode adicionar uma imagem de capa aqui no futuro */}
        </div>
        <div className="profile-avatar-section">
          <img 
            src={formData.profilePictureUrl || 'https://via.placeholder.com/150/1a1a2e/e0e0e0?text=Avatar'} 
            alt="Foto de perfil" 
            className="profile-avatar"
          />
          {isOwnProfile && (
            isEditingPic ? (
              <div className="edit-form-inline">
                <input 
                  type="text" 
                  name="profilePictureUrl" 
                  value={formData.profilePictureUrl} 
                  onChange={handleInputChange}
                  placeholder="URL da nova foto" 
                />
                <button onClick={() => handleSubmit('pic')}>Salvar</button>
                <button onClick={() => { setIsEditingPic(false); setFormData({...formData, profilePictureUrl: profileData.profilePictureUrl }); }}>Cancelar</button>
              </div>
            ) : (
              <button className="edit-button" onClick={() => handleEditToggle('pic')}>
                <i className="fas fa-camera"></i> Alterar Foto
              </button>
            )
          )}
        </div>
      </header>

      <main className="profile-main-content">
        <section className="profile-info-card">
          <div className="info-item username-item">
            {isEditingUsername && isOwnProfile ? (
              <div className="edit-form">
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} />
                <button onClick={() => handleSubmit('username')}>Salvar</button>
                <button onClick={() => { setIsEditingUsername(false); setFormData({...formData, username: profileData.username }); }}>Cancelar</button>
              </div>
            ) : (
              <>
                <h2>{profileData.username}</h2>
                {isOwnProfile && <button className="edit-icon-button" onClick={() => handleEditToggle('username')}><i className="fas fa-pencil-alt"></i></button>}
              </>
            )}
          </div>

          <div className="info-item">
            <strong>Email:</strong> {profileData.email}
          </div>

          <div className="info-item">
            <strong>Jogo Favorito:</strong>
            {isEditingGame && isOwnProfile ? (
              <div className="edit-form">
                <input type="text" name="favoriteGame" value={formData.favoriteGame} onChange={handleInputChange} />
                <button onClick={() => handleSubmit('game')}>Salvar</button>
                <button onClick={() => { setIsEditingGame(false); setFormData({...formData, favoriteGame: profileData.favoriteGame }); }}>Cancelar</button>
              </div>
            ) : (
              <>
                <span> {formData.favoriteGame || 'Não definido'}</span>
                {isOwnProfile && <button className="edit-icon-button" onClick={() => handleEditToggle('game')}><i className="fas fa-pencil-alt"></i></button>}
              </>
            )}
          </div>
          
          <div className="info-item">
            <strong>Bio:</strong>
            {isEditingBio && isOwnProfile ? (
              <div className="edit-form">
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} maxLength="250" />
                <button onClick={() => handleSubmit('bio')}>Salvar</button>
                <button onClick={() => { setIsEditingBio(false); setFormData({...formData, bio: profileData.bio }); }}>Cancelar</button>
              </div>
            ) : (
              <>
                <p className="bio-text">{formData.bio || 'Nenhuma bio definida.'}</p>
                {isOwnProfile && <button className="edit-icon-button" onClick={() => handleEditToggle('bio')}><i className="fas fa-pencil-alt"></i></button>}
              </>
            )}
          </div>

          <div className="info-item">
            <strong>Avaliação Média:</strong> 
            <span className="star-rating"> {renderStars(averageRating)} ({averageRating.toFixed(1)} de 5)</span>
             ({ratings.length} avaliações)
          </div>
          <div className="info-item">
            <strong>Membro desde:</strong> {new Date(profileData.createdAt).toLocaleDateString()}
          </div>
        </section>

        <section className="profile-ratings-feed">
          <h3>Avaliações Recebidas</h3>
          {ratings.length > 0 ? (
            <ul className="ratings-list">
              {ratings.map(rating => (
                <li key={rating._id} className="rating-item">
                  <div className="rating-header">
                    <img 
                      src={rating.rater?.profilePictureUrl || 'https://via.placeholder.com/40/1a1a2e/e0e0e0?text=U'} 
                      alt={rating.rater?.username || 'Avaliador'} 
                      className="rater-avatar"
                    />
                    <span className="rater-username">{rating.rater?.username || 'Usuário Anônimo'}</span>
                    <span className="rating-stars-display">{renderStars(rating.stars)}</span>
                  </div>
                  {rating.comment && <p className="rating-comment">"{rating.comment}"</p>}
                  <span className="rating-timestamp">{new Date(rating.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Este usuário ainda não recebeu avaliações.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;