import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LobbyPage from './pages/LobbyPage'; // Importe a nova página

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar (pode ser um componente separado para evitar repetição) */}
        <header className="header">
          <nav className="navbar">
            <div className="container">
              <h1 className="logo"><Link to="/">GGLink</Link></h1>
              <ul className="nav-links">
                <li><Link to="/features">Recursos</Link></li>
                <li><Link to="/how-it-works">Como Funciona</Link></li>
                <li><Link to="/register">Cadastre-se</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={
            <div className="landing-page-content">
              {/* Conteúdo da Landing Page, como antes */}
              <main className="main-content">
                <section className="hero-section">
                  <div className="container">
                    <h2>Conecte-se. Jogue. Vença.</h2>
                    <p>Encontre seus companheiros de equipe perfeitos e domine o campo de batalha.</p>
                    <Link to="/register" className="btn-primary">Comece Agora</Link>
                  </div>
                </section>
                <section id="features" className="features-section">
                  <div className="container">
                    <h3>Recursos Incríveis</h3>
                    <div className="feature-grid">
                      <div className="feature-item">
                        <h4>Encontre Partidas</h4>
                        <p>Descubra jogadores com interesses e níveis de habilidade semelhantes.</p>
                      </div>
                      <div className="feature-item">
                        <h4>Chat em Tempo Real</h4>
                        <p>Comunique-se instantaneamente com sua equipe e amigos.</p>
                      </div>
                      <div className="feature-item">
                        <h4>Crie Comunidades</h4>
                        <p>Participe de grupos e clãs para suas comunidades de jogos favoritas.</p>
                      </div>
                    </div>
                  </div>
                </section>
                <section id="how-it-works" className="how-it-works-section">
                  <div className="container">
                    <h3>Como Funciona</h3>
                    <div className="steps-grid">
                      <div className="step-item">
                        <span className="step-number">1</span>
                        <h4>Crie seu Perfil</h4>
                        <p>Personalize seu perfil de jogador com seus jogos e preferências.</p>
                      </div>
                      <div className="step-item">
                        <span className="step-number">2</span>
                        <h4>Encontre Jogadores</h4>
                        <p>Use nossos filtros para encontrar jogadores e equipes ideais.</p>
                      </div>
                      <div className="step-item">
                        <span className="step-number">3</span>
                        <h4>Conecte-se e Jogue</h4>
                        <p>Inicie partidas, converse e mergulhe na ação!</p>
                      </div>
                    </div>
                  </div>
                </section>
                <section id="join-us" className="join-us-section">
                  <div className="container">
                    <h3>Junte-se à Comunidade GGLink!</h3>
                    <p>Milhares de gamers já estão se conectando. O que você está esperando?</p>
                    <Link to="/register" className="btn-secondary">Registrar Agora</Link>
                  </div>
                </section>
              </main>
              <footer className="footer">
                <div className="container">
                  <p>&copy; 2025 GGLink. Todos os direitos reservados.</p>
                </div>
              </footer>
            </div>
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lobby/:id" element={<LobbyPage />} /> {/* Nova rota para a página do lobby */}
          {/* Adicione outras rotas conforme necessário */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;