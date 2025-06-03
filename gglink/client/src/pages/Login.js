import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css'; // Usaremos o mesmo CSS

function Login() {
  const [formData, setFormData] = useState({
    identifier: '', // Pode ser username ou email
    password: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' ou 'error'
  const navigate = useNavigate();

  const { identifier, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação básica do frontend
    if (!identifier || !password) {
      setMessage('Todos os campos são obrigatórios.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg || 'Login realizado com sucesso!');
        setMessageType('success');
        // Armazenar o token JWT no localStorage
        localStorage.setItem('gglink_token', data.token);
        // Redirecionar para o dashboard ou página principal após o login
        setTimeout(() => {
          navigate('/dashboard'); // Vamos criar esta rota depois
        }, 1500);
      } else {
        setMessage(data.msg || 'Credenciais inválidas.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      setMessage('Erro de conexão. Tente novamente mais tarde.');
      setMessageType('error');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login no GGLink</h2>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <div className="form-group">
          <label htmlFor="identifier">Nome de Usuário ou Email</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={identifier}
            onChange={handleChange}
            required
            aria-label="Nome de usuário ou email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handleChange}
            required
            aria-label="Senha"
          />
        </div>
        <button type="submit" className="btn-auth">Entrar</button>
        <p className="auth-footer">Não tem uma conta? <Link to="/register">Cadastre-se</Link></p>
      </form>
    </div>
  );
}

export default Login;