import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './Register.css';
import './Login.css'; // Reusing some base split-screen styles

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'ngo' ? 'ngo' : 'donor';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    rawPreferenceDescription: '',
    bio: '',
    location: '',
    logo: null,
    doc80G: null,
    docFCRA: null
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === 'donor' && !formData.rawPreferenceDescription.trim()) {
      setError('Please tell us what causes or impact goals you care about.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (formData.role === 'ngo') {
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null) {
            data.append(key, formData[key]);
          }
        });
        await register(data);
      } else {
        const donorData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'donor',
          rawPreferenceDescription: formData.rawPreferenceDescription
        };
        await register(donorData);
      }
      navigate(formData.role === 'ngo' ? '/ngo/dashboard' : '/donor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyzl2QcPJyoLIPdJWN1L1LUg0rQVrqkiDVqn42nmboS0ewejYOK2yJc5BIM2-5NCFoTi2Sc-ZH0XCxrV0pFMIGQ0XHnZ1QB2KJIrNUtE61wFqWQvqZX7L57HQuyo1VlVLfTLAHzK6XdEjM1vFIZHC1dQrLQ_km-r5brigJ3wcHDJ7e6J2PltZ7Y85tf8a9eUvhnTo_AR8Zcjz4TpT_1F3R8c9I-ElXfDY5mgvaIfcHystr6BAnv7rPWeYv2fBNLVF6dEpiNsGdGfWL" 
          alt="Impact Data visualization" 
        />
        <div className="visual-content">
          <div className="visual-branding">
            <h1>DonerHQ</h1>
            <p>Join the Impact Ledger</p>
          </div>
          
          <div className="badge-card glass-panel" style={{ marginTop: '5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <div className="feature-icon-box" style={{ width: '3rem', height: '3rem', marginBottom: 0 }}>
                 <span className="material-symbols-outlined text-primary symbol-fill">public</span>
               </div>
               <span className="label-sm font-headline">Global Reach</span>
             </div>
             <h3 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-headline)', fontWeight: 800 }}>150+</h3>
             <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
               verified organizations across India ready to turn your donation into direct on-ground impact.
             </p>
          </div>
        </div>
      </section>

      {/* Register Logic Side */}
      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="register-form-card glass-panel" style={{ maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
            <header className="card-header">
              <h2 className="font-headline">Initialize Account</h2>
              <p className="body-sm">Become part of the precision impact ecosystem.</p>
            </header>

            {error && (
              <div className="error-alert" style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,113,108,0.1)', border: '1px solid rgba(255,113,108,0.2)', borderRadius: '12px', color: 'var(--color-error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined">error_outline</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role Selection Tabs */}
              <div className="role-tab-group">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, role: 'donor'})}
                  className={`role-tab ${formData.role === 'donor' ? 'active' : ''}`}
                >
                  Donor Node
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, role: 'ngo'})}
                  className={`role-tab ${formData.role === 'ngo' ? 'active' : ''}`}
                >
                  NGO Node
                </button>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group-sm">
                  <label className="control-label-sm" htmlFor="name">Full Identity Name</label>
                  <input 
                    className="form-input" id="name" type="text" placeholder="John Doe" required 
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="form-group-sm">
                  <label className="control-label-sm" htmlFor="email">Email Identity</label>
                  <input 
                    className="form-input" id="email" type="email" placeholder="name@nexus.com" required 
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group-sm">
                <label className="control-label-sm" htmlFor="password">Secure Access Key</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input" id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" required 
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={{ paddingRight: '3.5rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Donor Specific: Free Text Intent Description */}
              {formData.role === 'donor' && (
                <div className="form-section-modern animate-in" style={{ marginTop: '2rem' }}>
                  <label className="control-label-sm" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>target</span>
                    What causes or impact goals do you care about?
                  </label>
                  <textarea 
                    className="form-input" rows="4" 
                    placeholder="Tell us what you care about in natural language (e.g. 'I want to fund clean drinking water initiatives and education for children in rural villages'). Gemini AI will dynamically customize your feed based on this."
                    value={formData.rawPreferenceDescription} 
                    onChange={(e) => setFormData({...formData, rawPreferenceDescription: e.target.value})}
                    style={{ resize: 'none', padding: '1.25rem', borderRadius: '1rem', lineHeight: '1.5' }}
                    required
                  />
                </div>
              )}

              {/* NGO Specific: Profile Details & Files */}
              {formData.role === 'ngo' && (
                <div className="form-section-modern animate-in" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div className="form-group-sm">
                      <label className="control-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>history_edu</span>
                         Foundational Mission Statement
                      </label>
                      <textarea 
                        className="form-input" rows="3" placeholder="Explain your organizational objective..."
                        value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        style={{ resize: 'none', padding: '1.25rem', borderRadius: '1rem', lineHeight: '1.5' }}
                        required
                      />
                   </div>
                   
                   <div className="form-group-sm">
                      <label className="control-label-sm">Primary Node Location</label>
                      <input 
                         className="form-input" type="text" placeholder="e.g. Mumbai, India" 
                         value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} 
                         required
                      />
                   </div>

                   <div className="form-group-sm">
                      <label className="control-label-sm">Verification Certificates (Legal Nodes)</label>
                      <div className="file-input-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                         <div className="custom-file-upload">
                            <input type="file" id="logo" style={{ display: 'none' }} onChange={(e) => setFormData({...formData, logo: e.target.files[0]})} />
                            <label htmlFor="logo" className={`file-label-modern ${formData.logo ? 'ready' : ''}`} style={{
                               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', 
                               borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                               <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: formData.logo ? 'var(--color-primary)' : 'var(--color-outline)' }}>{formData.logo ? 'check_circle' : 'add_a_photo'}</span>
                               <span className="label-xs" style={{ fontSize: '9px' }}>{formData.logo ? 'LOGO_READY' : 'ORG LOGO'}</span>
                            </label>
                         </div>
                         <div className="custom-file-upload">
                            <input type="file" id="doc80G" style={{ display: 'none' }} onChange={(e) => setFormData({...formData, doc80G: e.target.files[0]})} />
                            <label htmlFor="doc80G" className={`file-label-modern ${formData.doc80G ? 'ready' : ''}`} style={{
                               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', 
                               borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                               <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: formData.doc80G ? 'var(--color-primary)' : 'var(--color-outline)' }}>{formData.doc80G ? 'verified' : 'upload_file'}</span>
                               <span className="label-xs" style={{ fontSize: '9px' }}>{formData.doc80G ? '80G_VERIFIED' : '80G CERT'}</span>
                            </label>
                         </div>
                         <div className="custom-file-upload">
                            <input type="file" id="docFCRA" style={{ display: 'none' }} onChange={(e) => setFormData({...formData, docFCRA: e.target.files[0]})} />
                            <label htmlFor="docFCRA" className={`file-label-modern ${formData.docFCRA ? 'ready' : ''}`} style={{
                               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', 
                               borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                               <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: formData.docFCRA ? 'var(--color-primary)' : 'var(--color-outline)' }}>{formData.docFCRA ? 'verified' : 'description'}</span>
                               <span className="label-xs" style={{ fontSize: '9px' }}>{formData.docFCRA ? 'FCRA_READY' : 'FCRA DOC'}</span>
                            </label>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              <button 
                type="submit" disabled={loading} className="btn-auth btn"
                style={{ marginTop: '2.5rem', width: '100%', padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  {loading ? 'INITIALIZING PROTOCOL...' : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>verified_user</span>
                      <span>COMMIT IDENTITY TO LEDGER</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            <p className="bottom-text font-manrope" style={{ textAlign: 'center', marginTop: '2rem' }}>
              Already registered? 
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700, marginLeft: '0.5rem' }}>Access Account</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
