import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.user?.role;
      if (role === 'ngo') navigate('/ngo/dashboard');
      else if (role === 'admin') navigate('/admin');
      else navigate('/donor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page celestial-bg">
      {/* Visual Decorative Side */}
      <section className="login-visual-panel">
        <img 
          className="visual-image" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8AueamxpPRTNlb8mR40WcKidIL8gTmy662nWGD17suK2rXdXMhtp_r8ToZKr6jCxRK3PNcJTXW54l_pFB8z1kj7LmetfEjQvucQaf24AtcPFo6mUMJTq1Fuu7gbyr34eCKc4-75-fQmH06PGeRRjlOmVV-qfJTsi5073P9gZm9q1PdkFeVUXKWZeH89fW6YyY1aEI1pKbDxv14PysXCF0dzIC_j7V8iXi1ohFrNWMk_2RMz8TfSSwC_u0dbBArfkfcZJHTYv80R7M" 
          alt="Impact Data visualization" 
        />
        <div className="visual-content">
          <div className="visual-branding">
            <h1>DonerHQ</h1>
            <p>Transparency Starts Here</p>
          </div>
          
          <div className="badge-card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="feature-icon-box" style={{ width: '3rem', height: '3rem', marginBottom: 0 }}>
                <span className="material-symbols-outlined text-primary symbol-fill">shield_with_heart</span>
              </div>
              <span className="label-sm font-headline">Verified Impact</span>
            </div>
            <h3 className="display-sm" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>10,000+</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
              donors trust our celestial ledger protocol for secure, transparent giving.
            </p>
          </div>
        </div>

        <div className="visual-status-bar">
          <div className="status-module">
            <span className="label-sm" style={{ fontSize: '10px' }}>Protocol Status</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>NODE_ACTIVE // 0X-CELESTIAL</span>
          </div>
          <div className="status-module">
            <span className="label-sm" style={{ fontSize: '10px' }}>Network Uptime</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>99.999% SYNCED</span>
          </div>
        </div>
      </section>

      {/* Logic / Form Side */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-card glass-panel">
            <header className="card-header">
              <h2>Welcome Back</h2>
              <p>Access your global impact dashboard</p>
            </header>

            {error && (
              <div className="error-alert" style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,113,108,0.1)', border: '1px solid rgba(255,113,108,0.2)', borderRadius: '12px', color: 'var(--color-error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined">error_outline</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="label-bar">
                  <label className="control-label" htmlFor="email">Email Identity</label>
                </div>
                <input 
                  className="form-input"
                  id="email"
                  type="email"
                  placeholder="name@nexus.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <div className="label-bar">
                  <label className="control-label" htmlFor="password">Secure Key</label>
                  <Link to="/forgot-password" title="Recover Access" className="forgot-link">Forgot Key?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input"
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '3.5rem' }}
                  />
                  <button type="button" style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }}>
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="btn-auth btn"
              >
                {loading ? 'Authenticating...' : 'Login to Ledger'}
              </button>
            </form>

            <div className="auth-divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <div className="social-grid">
               <button className="social-btn">
                 <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1XefrV_K-gcaYM0G-TpbBg7aolaXkdAGc8ZNW5EY210fk1VuUdhR0GebzxQL3cXmwV_jyXlqd10yJTrSif_UJJybxI5UVGilinnmmB5Rcegg9pLbbl6rfoWoHMZ2vTDzZZyqycUPboTSr0OhU8ArQ4h_2cvhSVycSrVlFWZQmymZvL9GOa2n0Z_aTodWhvV2HLLtOTgLNqF4MLTbrsYTZf5DOPY8vyLvmGZIs_9a6GZ9nt0gttOt94bZKh-DivKWnmCcOgtR_tmld" alt="Google" style={{ width: '1.25rem', height: '1.25rem' }} />
                 <span className="body-sm font-bold">Google</span>
               </button>
               <button className="social-btn">
                 <span className="material-symbols-outlined text-primary">wallet</span>
                 <span className="body-sm font-bold">Web3</span>
               </button>
            </div>

            <p className="bottom-text font-manrope">
              New here? 
              <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700, marginLeft: '0.5rem' }}>Create Account</Link>
            </p>

            <div className="security-footer">
               <div className="badge-item">
                 <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>encrypted</span>
                 <span>AES-256</span>
               </div>
               <div className="badge-item">
                 <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>verified_user</span>
                 <span>SEC COMPLIANT</span>
               </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
