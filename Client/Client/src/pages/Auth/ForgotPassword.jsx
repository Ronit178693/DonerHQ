import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';
import API from '../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();


  // Client-side navigation triggers
  const handleSendOTP = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/password-reset-otp', {email});
      
    } catch (error) {
      console.error("Error in sending OTP:",error);
      setError(error.response?.data?.message || "Failed to send OTP. Please try again.");
    }finally {
      setLoading(false);
    }
    // Simulate transitioning to the verification step
    setStep(2);
  };

  const handleVerifyAndReset = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/reset-password', {email, otp, newPassword});
      if(res.data.success == true){
        alert("Password change successfuly");
        navigate("/login");
      }
      
    } catch (error) {
      console.error("Error in resetting password:",error);
      setError(error.response?.data?.message || "Failed to reset password. Please try again.");
    }finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page celestial-bg">
      {/* Visual Side Panel (Matches DonerHQ Premium Design) */}
      <section className="login-visual-panel">
        <img 
          className="visual-image" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8AueamxpPRTNlb8mR40WcKidIL8gTmy662nWGD17suK2rXdXMhtp_r8ToZKr6jCxRK3PNcJTXW54l_pFB8z1kj7LmetfEjQvucQaf24AtcPFo6mUMJTq1Fuu7gbyr34eCKc4-75-fQmH06PGeRRjlOmVV-qfJTsi5073P9gZm9q1PdkFeVUXKWZeH89fW6YyY1aEI1pKbDxv14PysXCF0dzIC_j7V8iXi1ohFrNWMk_2RMz8TfSSwC_u0dbBArfkfcZJHTYv80R7M" 
          alt="Recovery Ledger Status" 
        />
        <div className="visual-content">
          <div className="visual-branding">
            <h1>DonerHQ</h1>
            <p>Security & Auditing</p>
          </div>
          
          <div className="badge-card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="feature-icon-box" style={{ width: '3rem', height: '3rem', marginBottom: 0 }}>
                <span className="material-symbols-outlined text-primary symbol-fill">vpn_key</span>
              </div>
              <span className="label-sm font-headline">Recovery Protocol</span>
            </div>
            <h3 className="display-sm" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Keys & Escrow</h3>
            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
              Recover account signatures securely through multi-factor validation codes.
            </p>
          </div>
        </div>

        <div className="visual-status-bar">
          <div className="status-module">
            <span className="label-sm" style={{ fontSize: '10px' }}>Recovery System</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>SECURE_RESET // RSA-2048</span>
          </div>
          <div className="status-module">
            <span className="label-sm" style={{ fontSize: '10px' }}>Security Status</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>MONITORING_ACTIVE</span>
          </div>
        </div>
      </section>

      {/* Logic / Form Side */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-card glass-panel">

            {step === 1 ? (
              /* ─── STEP 1: REQUEST OTP ─── */
              <div>
                <header className="card-header">
                  <h2>Reset Password</h2>
                  <p>Enter your email to receive a password reset OTP.</p>
                </header>

                <form onSubmit={handleSendOTP}>
                  <div className="form-group">
                    <div className="label-bar">
                      <label className="control-label" htmlFor="email">Email Identity</label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="form-input"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@nexus.com"
                        value = {email}
                        onChange = {(e) => setEmail(e.target.value)}
                        required
                      />
                      <span className="material-symbols-outlined input-icon">mail</span>
                    </div>
                  </div>

                  <button type="submit" className="btn-auth">
                    Send OTP to Mail
                  </button>

                  <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      Remembered your password? <Link to="/login" className="forgot-link">Sign In</Link>
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              /* ─── STEP 2: ENTER OTP & NEW PASSWORD FOR VERIFICATION ─── */
              <div>
                <header className="card-header">
                  <h2>Verify & Reset</h2>
                  <p>Enter the OTP received on your email along with your new password.</p>
                </header>

                <form onSubmit={handleVerifyAndReset}>
                  {/* Email Input is included here as well because backend resetPassword requires it */}
                  <div className="form-group">
                    <div className="label-bar">
                      <label className="control-label" htmlFor="reset-email">Confirm Email</label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="form-input"
                        id="reset-email"
                        name="email"
                        type="email"
                        placeholder="name@nexus.com"
                        value={email}
                        readOnly
                        required
                      />
                      <span className="material-symbols-outlined input-icon">mail</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-bar">
                      <label className="control-label" htmlFor="otp">Enter OTP</label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="form-input"
                        id="otp"
                        name="otp"
                        type="text"
                        value = {otp}
                        onChange = {(e) => setOtp(e.target.value)}
                        maxLength={6}
                        placeholder="6-Digit OTP Code"
                        required
                        // Unbound: User will add value and onChange manually
                      />
                      <span className="material-symbols-outlined input-icon">lock_reset</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-bar">
                      <label className="control-label" htmlFor="newPassword">New Password</label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input 
                        className="form-input"
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value = {newPassword}
                        onChange = {(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        // Unbound: User will add value and onChange manually
                      />
                      <span className="material-symbols-outlined input-icon">key</span>
                      <button 
                        type="button" 
                        className="eye-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-auth">
                    Verify OTP & Change Password
                  </button>

                  <div className="auth-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="forgot-link" 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      ← Back to Send OTP
                    </button>
                    <Link to="/login" className="forgot-link">Sign In</Link>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}
