import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, RefreshCw, Gavel, Eye, EyeOff } from 'lucide-react'; // ← new icons
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './OTPVerification.css';

const OTPVerification: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);           // ← toggle state
  const { verifyOTP, login } = useAuth();
  const navigate = useNavigate();

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  useEffect(() => {
    const pendingPhone = localStorage.getItem('pendingPhoneNumber');
    if (!pendingPhone) { navigate('/login'); return; }

    const timer = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { setCanResend(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { toast.error('OTP is required'); return; }
    if (!/^\d{6}$/.test(otp)) { toast.error('OTP must be exactly 6 digits'); return; }

    const isAdmin = localStorage.getItem('isAdminLogin') === 'true';
    const phone   = localStorage.getItem('pendingPhoneNumber');

    if (isAdmin && phone === '+919999999999' && otp === '123456') {
      const admin = { id:'admin_001', phoneNumber:phone, role:'admin', name:'System Administrator',
                      personName:'System Administrator', companyName:'Auction Admin',
                      companyAddress:'Admin Office', email:'admin@auction.com',
                      mailId:'admin@auction.com', isVerified:true };
      localStorage.setItem('auctionUser', JSON.stringify(admin));
      localStorage.setItem('authToken', 'admin_token_'+Date.now());
      localStorage.removeItem('pendingPhoneNumber');
      localStorage.removeItem('isAdminLogin');
      toast.success('Admin login successful!');
      setTimeout(() => window.location.href = '/admin', 500);
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(otp);
      const user = JSON.parse(localStorage.getItem('auctionUser')||'{}');
      toast.success('Login successful!');
      navigate(user?.role==='admin' ? '/admin' : '/dashboard', {replace:true});
    } catch (err:any) { toast.error(err.message||'Invalid OTP'); }
    finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    const phone = localStorage.getItem('pendingPhoneNumber');
    if (!phone) return;
    if (localStorage.getItem('isAdminLogin')==='true' && phone==='+919999999999') {
      toast.success('Admin OTP: 123456');
      setCountdown(30); setCanResend(false); return;
    }
    try { await login(phone); toast.success('OTP resent!'); setCountdown(30); setCanResend(false);}
    catch { toast.error('Failed to resend OTP'); }
  };

  const phone = localStorage.getItem('pendingPhoneNumber');
  const isAdmin = localStorage.getItem('isAdminLogin')==='true';

  /* ---------------------------------- UI ---------------------------------- */
  return (
    <div className="ap-otp-wrapper">
      <div className="ap-otp-card">
        <div className="ap-otp-header">
          <div className="ap-otp-logo-row">
            <div className="ap-otp-logo-badge"><Gavel className="ap-otp-logo-icon"/></div>
            <div>
              <div className="ap-otp-brand-title">Quickauction</div>
              <div className="ap-otp-brand-sub">
                {isAdmin ? 'Admin Access - Verify identity' : 'Verify your identity to continue'}
              </div>
            </div>
          </div>
        </div>

        <div className="ap-otp-inner">
          {isAdmin &&
            <div className="ap-otp-admin-badge">
              <Shield className="ap-otp-admin-icon"/><span>Administrator Login</span>
            </div>}
          <div className="ap-otp-form-header">
            <h2 className="ap-otp-form-title"><Shield className="ap-otp-form-icon"/>Verify OTP</h2>
            <p className="ap-otp-form-subtitle">
              {isAdmin ? 'Use admin OTP: 123456' : `Enter the 6-digit code sent to ${phone}`}
            </p>
          </div>

          <div className="ap-otp-form-body">
            <form onSubmit={onSubmit} className="ap-otp-form">
              <div className="ap-otp-form-group">
                <label htmlFor="otp" className="ap-otp-label">
                  OTP Code <span style={{color:'red'}}>*</span>
                </label>
                <div style={{position:'relative'}}>
                  <input
                    type={showOtp ? 'text' : 'password'}
                    id="otp"
                    className="ap-otp-input"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    inputMode="numeric"
                    pattern="\d{6}"
                    required
                    title="Enter exactly 6 digits"
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    onMouseDown={(e)=>e.preventDefault()} // keep focus on input
                    onClick={()=>setShowOtp(v=>!v)}
                    style={{
                      position:'absolute',
                      right:'12px',
                      top:'50%',
                      transform:'translateY(-50%)',
                      background:'transparent',
                      border:'none',
                      cursor:'pointer',
                      color:'#6b7280'
                    }}
                    aria-label={showOtp ? 'Hide OTP' : 'Show OTP'}
                  >
                    {showOtp ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                <small className="ap-otp-hint">Enter exactly 6 digits</small>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length!==6}
                className="ap-otp-btn"
              >
                {isLoading ? <div className="ap-otp-spinner"/> :
                  <>{'Verify & Login'}<ArrowRight className="ap-otp-btn-icon"/></>
                }
              </button>
            </form>

            <div className="ap-otp-resend">
              {canResend
                ? <button onClick={handleResend} className="ap-otp-btn-secondary">
                    <RefreshCw className="ap-otp-resend-icon"/>Resend OTP
                  </button>
                : <p className="ap-otp-countdown">Resend OTP in {countdown}s</p>
              }
            </div>
          </div>

          <div className="ap-otp-footer">
            <p className="ap-otp-footer-text">
              Wrong number? <Link to="/login" className="ap-otp-footer-link">Change phone number</Link>
            </p>
          </div>
        </div>

        <div className="ap-otp-backhome">
          <Link to="/login" className="ap-otp-backhome-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
