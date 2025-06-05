import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faCamera } from '@fortawesome/free-solid-svg-icons';

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
  const { userId: pathUserId } = useParams(); 

  const getUserIdFromToken = useCallback(() => {
    const token = localStorage.getItem('gglink_token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload).user.id;
    } catch (e) { 
      console.error("Erro ao decodificar token:", e);
      return null; 
    }
  }, []);
  
  const loggedInUserId = getUserIdFromToken();
  const effectiveUserId = pathUserId || loggedInUserId;
  const isOwnProfile = !!loggedInUserId && effectiveUserId === loggedInUserId; 


  const fetchProfileData = useCallback(async () => {
    if (!effectiveUserId) { 
        setError('ID do usuário não encontrado.');
        setIsLoading(false);
        if (!loggedInUserId) navigate('/login');
        return;
    }
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('gglink_token');
    if (!token && isOwnProfile) { 
      navigate('/login');
      setIsLoading(false);
      return;
    }

    const endpoint = isOwnProfile ? `/api/users/me` : `/api/users/profile/${effectiveUserId}`;

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
  }, [navigate, effectiveUserId, loggedInUserId, isOwnProfile]); 

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditToggle = (field) => {
    if (profileData) {
        setFormData({
            username: profileData.username,
            favoriteGame: profileData.favoriteGame || '',
            bio: profileData.bio || '',
            profilePictureUrl: profileData.profilePictureUrl || ''
        });
    }

    if (field === 'username') setIsEditingUsername(prev => !prev);
    if (field === 'game') setIsEditingGame(prev => !prev);
    if (field === 'bio') setIsEditingBio(prev => !prev);
    if (field === 'pic') setIsEditingPic(prev => !prev);
  };

  const handleSubmit = async (field) => {
    const token = localStorage.getItem('gglink_token');
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    let payload = {};
    // Validações
    if (field === 'username') {
        if (!formData.username || formData.username.length < 3) {
            alert('Nome de usuário deve ter pelo menos 3 caracteres.');
            return;
        }
        payload.username = formData.username;
    }
    if (field === 'game') payload.favoriteGame = formData.favoriteGame;
    if (field === 'bio') payload.bio = formData.bio;
    if (field === 'pic') {
        if (formData.profilePictureUrl && !formData.profilePictureUrl.startsWith('http')) { 
            alert('URL da foto de perfil inválida. Deve começar com http ou https.');
            return;
        }
        payload.profilePictureUrl = formData.profilePictureUrl;
    }
    
    setIsLoading(true);
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
      setIsLoading(false); 

      if (response.ok) {
        alert(data.msg || 'Perfil atualizado!');
        if (data.profileData && data.profileData.user) {
            setProfileData(data.profileData.user);
            setRatings(data.profileData.ratingsReceived || []);
            setAverageRating(data.profileData.averageRating || 0);
            setFormData({
                username: data.profileData.user.username,
                favoriteGame: data.profileData.user.favoriteGame || '',
                bio: data.profileData.user.bio || '',
                profilePictureUrl: data.profileData.user.profilePictureUrl || ''
            });
        }
       
        if (field === 'username') setIsEditingUsername(false);
        if (field === 'game') setIsEditingGame(false);
        if (field === 'bio') setIsEditingBio(false);
        if (field === 'pic') setIsEditingPic(false);
        
        if (field === 'username' && payload.username !== (profileData ? profileData.username : '')) {
            window.dispatchEvent(new Event('authChange'));
        }
      } else {
        alert(`Erro: ${data.msg || 'Não foi possível atualizar o perfil.'}`);
      }
    } catch (err) {
      setIsLoading(false);
      alert('Erro de conexão ao atualizar perfil.');
      console.error(err);
    }
  };

  if (isLoading && !profileData) return <div className="profile-loading">Carregando perfil...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profileData && !isLoading) return <div className="profile-error">Perfil não encontrado ou não acessível.</div>; 
  if (!profileData && isLoading) return <div className="profile-loading">Carregando perfil...</div>; 


  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.25 && rating % 1 < 0.75; 
    const almostFullStar = rating % 1 >= 0.75;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '★';
    if (almostFullStar) stars += '★'; 
    else if (halfStar) stars += '½'; 
    stars += '☆'.repeat(5 - stars.length);
    return stars;
  };

  return (
    <div className="profile-page-container">
      <header className="profile-header">
        <div className="profile-banner" style={profileData?.bannerUrl ? { backgroundImage: `url(${profileData.bannerUrl})` } : {}}>
        </div>
        <div className="profile-avatar-section">
          <img 
            src={isEditingPic && isOwnProfile ? formData.profilePictureUrl : (profileData?.profilePictureUrl || 'https://via.placeholder.com/150/1a1a2e/e0e0e0?text=Avatar')} 
            alt="Foto de perfil" 
            className="profile-avatar"
          />
          {isOwnProfile && (
            isEditingPic ? (
              <div className="edit-form-inline avatar-edit-form">
                <input 
                  type="text" 
                  name="profilePictureUrl" 
                  value={formData.profilePictureUrl} 
                  onChange={handleInputChange}
                  placeholder="URL da nova foto de perfil" 
                />
                <button onClick={() => handleSubmit('pic')} disabled={isLoading}>Salvar Foto</button>
                <button onClick={() => { setIsEditingPic(false); setFormData({...formData, profilePictureUrl: profileData.profilePictureUrl }); }} disabled={isLoading}>Cancelar</button>
              </div>
            ) : (
              <button className="edit-button avatar-edit-trigger" onClick={() => handleEditToggle('pic')}>
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
                <button onClick={() => handleSubmit('username')} disabled={isLoading}>Salvar</button>
                <button onClick={() => { setIsEditingUsername(false); setFormData({...formData, username: profileData.username }); }} disabled={isLoading}>Cancelar</button>
              </div>
            ) : (
              <div className="display-value-container">
                <h2>{profileData?.username}</h2>
                {isOwnProfile && <button className="edit-icon-button" onClick={() => handleEditToggle('username')}><FontAwesomeIcon icon={faPencilAlt} /></button>}
              </div>
            )}
          </div>

          <div className="info-item">
            {isEditingGame && isOwnProfile ? (
              <div className="edit-form">
                <input type="text" name="favoriteGame" placeholder="Seu jogo favorito" value={formData.favoriteGame} onChange={handleInputChange} />
                <button onClick={() => handleSubmit('game')} disabled={isLoading}>Salvar</button>
                <button onClick={() => { setIsEditingGame(false); setFormData({...formData, favoriteGame: profileData.favoriteGame }); }} disabled={isLoading}>Cancelar</button>
              </div>
            ) : (
              <div className="display-value-container">
                <strong>Jogo Favorito:</strong> 
                <span> {profileData?.favoriteGame || (isOwnProfile ? 'Clique no lápis para adicionar...' : 'Não definido')}</span>
                {isOwnProfile && <button className="edit-icon-button" onClick={() => handleEditToggle('game')}><FontAwesomeIcon icon={faPencilAlt} /></button>}
              </div>
            )}
          </div>
          
          <div className="info-item">
            {isEditingBio && isOwnProfile ? (
              <div className="edit-form">
                <textarea name="bio" placeholder="Conte um pouco sobre você..." value={formData.bio} onChange={handleInputChange} maxLength="250" />
                <button onClick={() => handleSubmit('bio')} disabled={isLoading}>Salvar</button>
                <button onClick={() => { setIsEditingBio(false); setFormData({...formData, bio: profileData.bio }); }} disabled={isLoading}>Cancelar</button>
              </div>
            ) : (
              <div className="display-value-container bio-display">
                 <strong>Bio:</strong>
                <p className="bio-text">{profileData?.bio || (isOwnProfile ? 'Clique no lápis para adicionar sua bio...' : 'Nenhuma bio definida.')}</p>
                {isOwnProfile && <button className="edit-icon-button" onClick={() => handleEditToggle('bio')}><FontAwesomeIcon icon={faPencilAlt} /></button>}
              </div>
            )}
          </div>

          <div className="info-item">
            <strong>Avaliação Média:</strong> 
            <span className="star-rating"> {renderStars(averageRating)} ({averageRating > 0 ? averageRating.toFixed(1) : 'N/A'})</span>
             ({ratings.length} avaliações)
          </div>
          <div className="info-item">
            <strong>Membro desde:</strong> <span>{new Date(profileData?.createdAt || Date.now()).toLocaleDateString()}</span>
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
                      src={rating.rater?.profilePictureUrl || 'https://via.placeholder.com/40/24243a/e0e0e0?text=U'} 
                      alt={rating.rater?.username || 'Avaliador'} 
                      className="rater-avatar"
                    />
                    <span className="rater-username">{rating.rater?.username || 'Usuário Desconhecido'}</span>
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