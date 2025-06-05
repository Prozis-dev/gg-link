import React, { useState, useEffect, useRef, useCallback } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = useCallback(() => { 
    localStorage.removeItem('gglink_token');
    setIsLoggedIn(false);
    setUserName('');
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  }, [navigate]);

  const fetchAndSetUserData = useCallback(async () => {
    const token = localStorage.getItem('gglink_token');
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: { 'x-auth-token': token }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.username) {
            setUserName(data.user.username);
            setIsLoggedIn(true);
          } else {
            
            console.warn('Navbar: Usuário logado, mas nome de usuário não encontrado nos dados.', data);
            setUserName('Usuário'); 
            setIsLoggedIn(true);
          }
        } else {
          console.error('Navbar: Falha ao buscar dados do usuário (resposta não OK), limpando token.');
          handleLogout(); 
        }
      } catch (error) {
        console.error('Navbar: Erro de conexão ao buscar dados do usuário:', error);
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [handleLogout]); 

  useEffect(() => {
    fetchAndSetUserData();

    const handleAuthChange = () => {
      fetchAndSetUserData();
    };

    window.addEventListener('authChange', handleAuthChange);

    window.addEventListener('storage', handleAuthChange);

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchAndSetUserData]);

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenuAndDropdown = () => {
    setIsMobileMenuOpen(false);
    setShowDropdown(false);
  };


  return (
    <nav className="navbar-container">
      <div className="navbar-logo">
        <Link to="/" onClick={closeMobileMenuAndDropdown}>GGLink</Link>
      </div>
      <div className="navbar-hamburger" onClick={toggleMobileMenu}>
        <i className={isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
      </div>
      <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
        {!isLoggedIn ? (
          <>
            <li><Link to="/login" className="navbar-button login-button" onClick={closeMobileMenuAndDropdown}>Login</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/dashboard" onClick={closeMobileMenuAndDropdown}>Lobbies</Link></li>
            <li><Link to="/communities" onClick={closeMobileMenuAndDropdown}>Comunidades</Link></li>
            <li className="navbar-user-dropdown" ref={dropdownRef}>
              <button onClick={toggleDropdown} className="navbar-username-button">
                {userName || 'Carregando...'} <i className={`fas fa-caret-down ${showDropdown ? 'open' : ''}`}></i>
              </button>
              {showDropdown && (
                <ul className={`dropdown-menu ${showDropdown ? 'show-dropdown' : ''}`}>
                  <li><Link to="/profile" onClick={closeMobileMenuAndDropdown}>Ver Perfil</Link></li>
                  <li><button onClick={() => { handleLogout(); closeMobileMenuAndDropdown(); }}>Logout</button></li>
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