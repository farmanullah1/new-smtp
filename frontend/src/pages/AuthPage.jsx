import React, { useState } from 'react';
import { Mail, Lock, User, Shield, ArrowRight, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { signup, login, verifyEmail, resendOtp, verifyLogin2FA, forgotPassword, verifyResetOtp, resetPassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { OtpModal } from '../components/OtpModal';

const calculatePasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#f43f5e' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (score === 3) return { score: 3, label: 'Good', color: '#38bdf8' };
  return { score: 4, label: 'Strong', color: '#10b981' };
};

export const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

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

  const pwStrength = calculatePasswordStrength(password);
  const resetPwStrength = calculatePasswordStrength(newPassword);

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '36px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
            }}
          >
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
        <div
          role="tablist"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={isLoginView}
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
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLoginView}
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
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
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
                <label className="form-label" htmlFor="auth-name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    id="auth-name"
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
                <label className="form-label" htmlFor="auth-role">Account Role</label>
                <select
                  id="auth-role"
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
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <input
                id="auth-email"
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
              <label className="form-label" htmlFor="auth-password" style={{ margin: 0 }}>Password</label>
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
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                required
                minLength={6}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator for Signup */}
            {!isLoginView && password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Password strength</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: pwStrength.color }}>
                    {pwStrength.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        backgroundColor: step <= pwStrength.score ? pwStrength.color : 'rgba(255, 255, 255, 0.1)',
                        transition: 'background-color 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
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
        <div
          role="dialog"
          aria-modal="true"
          style={{
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
          }}
        >
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <KeyRound size={24} color="#818cf8" />
              </div>
              <h2 style={{ fontSize: '20px' }}>Recover Password</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
                {resetStep === 1
                  ? 'Step 1 of 2: Enter your email to receive a recovery code.'
                  : 'Step 2 of 2: Enter code & set your new password.'}
              </p>
            </div>

            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: resetStep >= 1 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: resetStep >= 2 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'
                }}
              />
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">Account Email</label>
                  <input
                    id="forgot-email"
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
                  <label className="form-label" htmlFor="reset-code">6-Digit Reset Code</label>
                  <input
                    id="reset-code"
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
                  <label className="form-label" htmlFor="reset-password">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reset-password"
                      type={showResetPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      style={{ paddingRight: '40px' }}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '11px',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Password strength</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: resetPwStrength.color }}>
                          {resetPwStrength.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            style={{
                              flex: 1,
                              borderRadius: '2px',
                              backgroundColor: step <= resetPwStrength.score ? resetPwStrength.color : 'rgba(255, 255, 255, 0.1)',
                              transition: 'background-color 0.3s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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
