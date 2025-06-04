import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Criaremos este CSS a seguir

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Função para decodificar o token e obter o ID do usuário
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('gglink_token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded.user ? decoded.user.id : null;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('gglink_token');
    if (token) {
      setIsLoggedIn(true);
      const userId = getUserIdFromToken();
      if (userId) {
        // Para obter o nome de usuário real, você precisaria de um endpoint no backend
        // que retorne os dados do usuário (ex: /api/users/me ou /api/users/:id)
        // ou incluir o username no payload do token JWT durante o login.
        // Por enquanto, usaremos um placeholder ou você pode implementar essa chamada.
        // Exemplo de chamada (você precisaria criar este endpoint no backend):
        /*
        fetch(`http://localhost:5000/api/users/${userId}`, { // Endpoint fictício
          headers: { 'x-auth-token': token }
        })
        .then(res => res.json())
        .then(data => {
          if (data && data.username) {
            setUserName(data.username);
          } else {
            setUserName('Usuário'); // Fallback
          }
        })
        .catch(() => setUserName('Usuário')); // Fallback em caso de erro
        */
        setUserName(`Usuário ${userId.substring(0,6)}...`); // Placeholder com ID parcial
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [navigate]); // Dependência `Maps` para reavaliar ao mudar de rota (após login/logout)

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('gglink_token');
      if (token) {
        setIsLoggedIn(true);
        const userId = getUserIdFromToken();
         if (userId) {
           setUserName(`Usuário ${userId.substring(0,6)}...`); // Atualiza nome no login/logout
         }
      } else {
        setIsLoggedIn(false);
        setUserName('');
      }
    };

    window.addEventListener('storage', handleStorageChange); // Ouve mudanças no localStorage de outras abas
    // Dispara um evento customizado para re-check do token na aba atual após login/logout programático
    window.addEventListener('authChange', handleStorageChange);


    // Fechar dropdown se clicar fora
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gglink_token');
    setIsLoggedIn(false);
    setUserName('');
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event('authChange')); // Notifica outras partes da app se necessário
    navigate('/login');
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);


  return (
    <nav className="navbar-container">
      <div className="navbar-logo">
        <Link to="/" onClick={closeMobileMenu}>GGLink</Link>
      </div>
      <div className="navbar-hamburger" onClick={toggleMobileMenu}>
        <i className={isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i> {/* Use FontAwesome ou SVGs */}
      </div>
      <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
        {!isLoggedIn ? (
          <>
            <li><Link to="/login" className="navbar-button login-button" onClick={closeMobileMenu}>Login</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/dashboard" onClick={closeMobileMenu}>Lobbies</Link></li>
            <li><Link to="/communities" onClick={closeMobileMenu}>Comunidades</Link></li>
            <li className="navbar-user-dropdown" ref={dropdownRef}>
              <button onClick={toggleDropdown} className="navbar-username-button">
                {userName || 'Perfil'} <i className={`fas fa-caret-down ${showDropdown ? 'open' : ''}`}></i>
              </button>
              {showDropdown && (
                <ul className="dropdown-menu">
                  <li><Link to="/profile" onClick={() => { setShowDropdown(false); closeMobileMenu(); }}>Ver Perfil</Link></li>
                  <li><button onClick={() => {handleLogout(); closeMobileMenu();}}>Logout</button></li>
                </ul>
              )}
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;