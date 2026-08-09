import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = ({ setAuth }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, fullName })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('email', data.username);
        localStorage.setItem('fullName', data.fullName);
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
          
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem', fontFamily: 'serif' }}>Create account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start organising your work today.</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</div>}
          
          <div className="form-group">
            <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Full name</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
              required
              style={{ width: '100%', background: '#efece6', border: '1px solid #d1cfc7', padding: '0.75rem' }}
            />
          </div>

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
            Create account
          </button>
          
          <div className="auth-links" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
