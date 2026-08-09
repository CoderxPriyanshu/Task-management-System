import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('email', data.username);
        localStorage.setItem('fullName', data.fullName || 'User');
        setAuth(true);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="auth-header" style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem', fontFamily: 'serif' }}>Task Manager</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>Focus on what matters most.</p>
          
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem', fontFamily: 'serif' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to continue to your workspace.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</div>}
          
          <div className="form-group">
            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
              required
              style={{ width: '100%', background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
            />
          </div>
          
          <div className="form-group">
            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '2.5rem', background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'block', padding: '0.85rem', fontWeight: '600', marginTop: '0.5rem', background: '#c25e28' }}>
            Sign in
          </button>
          
          <div className="auth-links" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
