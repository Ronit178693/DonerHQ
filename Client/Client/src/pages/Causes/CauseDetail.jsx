import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import useAuthStore from '../../stores/authStore';
import './CauseDetail.css';

export default function CauseDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cause, setCause] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isGoalReached = cause ? cause.raisedAmount >= cause.goalAmount : false;

  const handleDonate = async () => {
    // Auth guard — redirect guests to login
    if (!user) {
      toast.error('Please log in to deploy capital.');
      navigate('/login');
      return;
    }

    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount <= 0) {
      toast.error('Please select or enter a valid donation amount.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Order on Backend
      const { data } = await API.post('/donations/create-order', {
        causeId: id,
        amount: amount
      });

      if (!data.success) throw new Error(data.message);

      const { order } = data;

      // 2. Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SYJU0pNkKgk6kU', 
        amount: order.amount,
        currency: order.currency,
        name: "DonerHQ",
        description: `Impact Contribution: ${cause.title}`,
        image: "/vite.svg", // Re-using existing logo
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment on Backend
            const verifyRes = await API.post('/donations/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              causeId: id,
              amount: amount
            });

            if (verifyRes.data.success) {
              toast.success('Donation successful! Your contribution is now secured in Escrow.');
              // Update local cause state to reflect new raised amount and donor count
              setCause(verifyRes.data.updatedCause);
            } else {
              toast.error('Payment verification failed: ' + verifyRes.data.message);
            }
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('An error occurred during payment verification.');
          }
        },
        prefill: {
          name: user?.name || "Donor Name",
          email: user?.email || "donor@example.com"
        },
        theme: {
          color: "#b9ffe8"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Payment initialization error:', err);
      toast.error('Could not initialize payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    API.get(`/causes/${id}`)
      .then(res => setCause(res.data.cause))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid rgba(185,255,232,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!cause) {
    return (
      <div style={{ minHeight: '100vh', padding: '10rem 2.5rem', textAlign: 'center' }}>
        <h1 className="display-md">Cause not found</h1>
        <p className="body-lg" style={{ color: 'var(--color-on-surface-variant)', marginTop: '1rem' }}>The requested impact mission could not be identified.</p>
      </div>
    );
  }

  const percent = Math.min(Math.round((cause.raisedAmount / cause.goalAmount) * 100), 100);

  return (
    <main className="cause-detail-page">
      {/* Hero Banner Section */}
      <section className="cause-hero">
        <div className="hero-overlay"></div>
        <img 
          src={cause.coverImage || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2670&auto=format&fit=crop"} 
          alt={cause.title} 
          className="hero-image" 
        />
        <div className="hero-content-bottom">
          <div className="verified-mission-badge">
            <span className="material-symbols-outlined text-primary symbol-fill" style={{ fontSize: '1rem' }}>verified</span>
            <span className="label-sm font-bold font-headline">{cause.ngoId?.name || 'Verified Mission Entity'}</span>
          </div>
          <h1 className="hero-title">{cause.title}</h1>
        </div>
      </section>

      <div className="detail-grid">
        {/* Story Column */}
        <div className="detail-story-col">
          {/* Mission Description */}
          <article>
            <div className="section-label-group">
              <div className="label-line"></div>
              <h2 className="label-sm font-bold font-headline">About This Mission</h2>
            </div>
            <div className="story-prose">
              <p className="body-lg" style={{ fontSize: '1.25rem', color: 'var(--color-on-surface)', fontWeight: 300 }}>
                {cause.description}
              </p>
              <p className="body-md" style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                DonerHQ is partnering with our verified NGO network to ensure every rupee of your capital is deployed with precision. This mission operates on our "Celestial Ledger" protocol, meaning funds are only released to ground operations upon submission of verifiable visual and data-driven evidence of impact task completion.
              </p>
            </div>
          </article>

          {/* Proof of impact gallery */}
          <section style={{ marginTop: '5rem' }}>
             <div className="section-label-group">
                <div className="label-line"></div>
                <h2 className="label-sm font-bold font-headline">Verified Evidence</h2>
             </div>
             
             {cause.impactVideoUrl ? (
                <div className="glass-panel" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(185, 255, 232, 0.15)', background: '#000' }}>
                   <video 
                      src={cause.impactVideoUrl} 
                      controls 
                      className="impact-proof-video"
                      style={{ width: '100%', aspectRatio: '16/9', display: 'block' }} 
                   />
                   <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>verified_user</span>
                      <span className="label-sm font-bold">IMMUTABLE PROOF OF WORK</span>
                   </div>
                </div>
             ) : (
                <div className="glass-panel" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: '1rem', border: '1px solid rgba(185, 255, 232, 0.05)' }}>
                  <div style={{ aspectRatio: '16/9', position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: 'var(--color-surface-container-low)' }}>
                    <img src={cause.coverImage} alt="Video proof" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                        <span className="material-symbols-outlined text-muted" style={{ fontSize: '3rem', marginBottom: '1rem' }}>hourglass_empty</span>
                        <h4 className="font-headline">Awaiting Field Evidence</h4>
                        <p className="body-xs" style={{ opacity: 0.6, maxWidth: '240px' }}>Ground operations are currently progress. Evidence will be published post-completion.</p>
                    </div>
                  </div>
                </div>
             )}
          </section>
        </div>

        {/* Donation Interface Column */}
        <aside className="detail-donation-col">
          <div className="donation-panel-card glass-panel">
            <header className="donation-progress-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div>
                  <span className="current-raised">₹{cause.raisedAmount?.toLocaleString('en-IN')}</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>of ₹{cause.goalAmount?.toLocaleString('en-IN')} precision goal</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="text-primary font-headline" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{percent}%</span>
                </div>
              </div>
              <div className="progress-bar-container" style={{ height: '0.75rem' }}>
                 <div className="progress-fill" style={{ width: `${percent}%`, borderRadius: '0.375rem' }}></div>
              </div>
              <div className="goal-info">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>group</span>
                    <span>{cause.donorCount || 0} supporters</span>
                 </div>
                 <span>Status: <span style={{ color: 'var(--color-primary)' }}>{cause.status?.toUpperCase()}</span></span>
              </div>
            </header>

            <div className="amount-interface">
               <h3 className="label-sm font-bold font-headline" style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.625rem' }}>Select Capital Allocation</h3>
               <div className="amount-selector-grid">
                  {[100, 500, 1000, 5000].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`amount-option ${selectedAmount === amt ? 'selected' : ''}`}
                    >
                      ₹{amt}
                    </button>
                  ))}
               </div>
               <div className="custom-input-wrapper">
                  <span style={{ fontWeight: 800, color: 'var(--color-primary-dim)', marginRight: '0.75rem' }}>₹</span>
                  <input 
                    className="custom-input" 
                    placeholder="Enter custom node value" 
                    type="number"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                  />
               </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleDonate}
              disabled={isProcessing || isGoalReached}
              style={{ 
                width: '100%', 
                marginTop: '2.5rem', 
                padding: '1.5rem', 
                fontSize: '1.25rem', 
                borderRadius: '1.25rem', 
                boxShadow: isGoalReached ? 'none' : '0 10px 40px rgba(185, 255, 232, 0.2)',
                background: isGoalReached ? 'var(--color-surface-container-highest)' : 'var(--color-primary)',
                color: isGoalReached ? 'var(--color-outline)' : 'var(--color-on-primary)',
                opacity: isGoalReached ? 0.7 : 1,
                cursor: isGoalReached ? 'not-allowed' : 'pointer',
                border: isGoalReached ? '1px solid var(--color-outline-variant)' : 'none'
              }}
            >
               {isProcessing ? 'Initializing...' : (isGoalReached ? 'Capital Goal Secured' : 'Deploy Donation')}
            </button>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
               <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(185, 255, 232, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="material-symbols-outlined text-primary symbol-fill" style={{ fontSize: '1.25rem' }}>shield</span>
                    <span className="label-xs font-bold font-headline" style={{ fontSize: '0.625rem', textTransform: 'uppercase' }}>Escrow Holding Status</span>
                  </div>
                  <span className="label-xs font-black" style={{ color: 'var(--color-primary)', background: 'rgba(185,255,232,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {cause.escrowStatus === 'released' ? 'RELEASED' : cause.escrowStatus === 'video_uploaded' ? 'PROOF SUBMITTED' : cause.escrowStatus === 'disputed' ? 'AUDIT' : 'SECURED'}
                  </span>
               </div>
               <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginTop: '1.5rem', fontStyle: 'italic' }}>
                  "Precision impact security: Funds are only disbursed upon verifiable ground-level task completion."
               </p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="material-symbols-outlined text-outline" style={{ fontSize: '1.25rem' }}>encrypted</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1rem', color: 'var(--color-outline)' }}>
                   Smart Node ID: <span style={{ color: 'var(--color-on-surface-variant)' }}>{cause._id ? `0x${cause._id.slice(0, 6)}...${cause._id.slice(-4)}` : '—'}</span>
                </span>
             </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
