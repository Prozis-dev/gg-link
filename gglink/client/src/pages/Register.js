import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css'; 

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      setMessage('Todos os campos são obrigatórios.');
      setMessageType('error');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      setMessageType('error');
      return;
    }
    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.');
      setMessageType('error');
      return;
    }
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(email)) {
      setMessage('Por favor, insira um e-mail válido.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg || 'Cadastro realizado com sucesso!');
        setMessageType('success');
        localStorage.setItem('gglink_token', data.token);
        setTimeout(() => {
          navigate('/login'); 
        }, 1500);
      } else {
        setMessage(data.msg || 'Erro ao cadastrar.');
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
        <h2>Cadastre-se no GGLink</h2>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <div className="form-group">
          <label htmlFor="username">Nome de Usuário</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            required
            aria-label="Nome de usuário"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            required
            aria-label="Email"
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
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Senha</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            required
            aria-label="Confirmar Senha"
          />
        </div>
        <button type="submit" className="btn-auth">Cadastrar</button>
        <p className="auth-footer">Já tem uma conta? <Link to="/login">Faça Login</Link></p>
      </form>
    </div>
  );
}

export default Register;