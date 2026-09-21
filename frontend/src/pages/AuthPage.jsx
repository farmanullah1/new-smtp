import React, { useState } from 'react';
import { Mail, Lock, User, Shield, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { signup, login, verifyEmail, resendOtp, verifyLogin2FA, forgotPassword, verifyResetOtp, resetPassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { OtpModal } from '../components/OtpModal';

export const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  // OTP Modal State
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    purpose: '', // 'signup' | '2fa' | 'reset'
    email: ''
  });

  // Forgot Password Flow State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: request code, 2: enter code & new pass
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { login: authLogin } = useAuth();
  const toast = useToast();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await signup({ name, email, password, role });
      toast.success(res.message || 'Verification code sent to your email!');
      setOtpModal({
        isOpen: true,
        purpose: 'signup',
        email
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email, password });

      if (res.requires2FA) {
        toast.info('Two-Factor Authentication required. Enter code sent to your email.');
        setOtpModal({
          isOpen: true,
          purpose: '2fa',
          email
        });
        return;
      }

      authLogin(res.tokens, res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
    } catch (err) {
      if (err.requiresEmailVerification) {
        toast.info('Please verify your email address to log in.');
        // Trigger resend and open verification modal
        try {
          await resendOtp({ email });
          setOtpModal({
            isOpen: true,
            purpose: 'signup',
            email
          });
        } catch {}
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (code) => {
    try {
      if (otpModal.purpose === 'signup') {
        const res = await verifyEmail({ email: otpModal.email, code });
        toast.success('Email verified successfully! Welcome.');
        setOtpModal({ ...otpModal, isOpen: false });
        if (res.tokens) {
          authLogin(res.tokens, res.user);
        }
      } else if (otpModal.purpose === '2fa') {
        const res = await verifyLogin2FA({ email: otpModal.email, code });
        toast.success('Two-factor authentication successful!');
        setOtpModal({ ...otpModal, isOpen: false });
        authLogin(res.tokens, res.user);
      }
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleOtpResend = async () => {
    try {
      await resendOtp({ email: otpModal.email });
      toast.success('Fresh verification code sent!');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await forgotPassword({ email: forgotEmail });
      toast.success('Password reset instructions sent to your email.');
      setResetStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const verifyRes = await verifyResetOtp({ email: forgotEmail, code: resetCode });
      await resetPassword({
        email: forgotEmail,
        resetToken: verifyRes.resetToken,
        newPassword
      });
      toast.success('Password reset successfully! You may now sign in.');
      setShowForgotModal(false);
      setResetStep(1);
      setResetCode('');
      setNewPassword('');
      setIsLoginView(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
          }}>
            <Shield size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>
            {isLoginView ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {isLoginView
              ? 'Sign in to manage your SMTP emails and resources'
              : 'Register to start receiving dynamic emails and access the API'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            type="button"
            onClick={() => setIsLoginView(true)}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: isLoginView ? 'var(--gradient-brand)' : 'transparent',
              color: isLoginView ? '#ffffff' : '#94a3b8',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLoginView(false)}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              background: !isLoginView ? 'var(--gradient-brand)' : 'transparent',
              color: !isLoginView ? '#ffffff' : '#94a3b8',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={isLoginView ? handleLogin : handleSignup}>
          {!isLoginView && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Farmanullah Ansari"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User (Standard Access)</option>
                  <option value="admin">Admin (Full System Access)</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '38px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              {isLoginView && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '38px' }}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Processing...' : isLoginView ? 'Sign In to Dashboard' : 'Create Free Account'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModal.isOpen}
        title={otpModal.purpose === 'signup' ? 'Verify Your Email' : 'Two-Factor Verification'}
        subtitle={
          otpModal.purpose === 'signup'
            ? 'We sent a 6-digit verification code to'
            : 'Enter the 2FA code dispatched to'
        }
        email={otpModal.email}
        onVerify={handleOtpVerify}
        onResend={otpModal.purpose === 'signup' ? handleOtpResend : undefined}
        onClose={() => setOtpModal({ ...otpModal, isOpen: false })}
      />

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <KeyRound size={24} color="#818cf8" />
              </div>
              <h2 style={{ fontSize: '20px' }}>Recover Password</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                {resetStep === 1
                  ? 'Enter your registered email to receive a password recovery OTP code.'
                  : 'Enter the 6-digit code from your email and set your new password.'}
              </p>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Account Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">6-Digit Reset Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
