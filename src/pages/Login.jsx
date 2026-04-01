import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Lock, User, AlertCircle } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.login({ username, password });
      
      // Save token and user info
      localStorage.setItem('pos_token', response.accessToken);
      localStorage.setItem('pos_user', JSON.stringify({
        username: response.username,
        nombreCompleto: response.nombreCompleto,
        role: response.role
      }));

      // Redirect to dashboard
      window.location.href = '/';
    } catch (err) {
      console.error('Login error:', err);
      console.error('Response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Credenciales inválidas o servidor inalcanzable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-box">
            <div className="login-logo-pos">POS</div>
            <div className="login-logo-nunez">NUNEZ</div>
          </div>
          <h2>Bienvenido de Vuelta</h2>
          <p>Inicia sesion para continuar</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Correo electronico</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. admin"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Contrasena</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ej. admin123"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesion'}
          </button>
        </form>

        <div className="login-footer-hint">
          <p>Demo: admin</p>
          <p>Contrasena: admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
