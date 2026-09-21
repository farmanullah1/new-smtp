import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, X } from 'lucide-react';

export const OtpModal = ({
  isOpen,
  title = 'Email Verification',
  subtitle = 'Please enter the 6-digit security code sent to your email.',
  email,
  expiryMinutes = 10,
  onVerify,
  onResend,
  onClose
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expiryMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimeLeft(expiryMinutes * 60);
      setErrorMessage('');
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen, expiryMinutes]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    setErrorMessage('');
    const cleanVal = value.replace(/\D/g, '');

    if (cleanVal.length > 1) {
      // Pasting full 6 digits
      const pasted = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    pastedData.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
    const targetIdx = Math.min(pastedData.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const fullCode = digits.join('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (fullCode.length !== 6 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onVerify(fullCode);
    } catch (err) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isResending || resendCooldown > 0 || !onResend) return;
    try {
      setIsResending(true);
      setErrorMessage('');
      await onResend();
      setTimeLeft(expiryMinutes * 60);
      setResendCooldown(30); // 30s cooldown between resend clicks
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '32px',
        position: 'relative',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)'
        }}>
          <ShieldCheck size={28} color="#818cf8" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#f8fafc' }}>{title}</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px', lineHeight: '1.5' }}>
          {subtitle}
        </p>
        {email && (
          <p style={{
            color: '#38bdf8',
            fontWeight: '600',
            fontSize: '14px',
            marginBottom: '20px',
            wordBreak: 'break-all'
          }}>
            {email}
          </p>
        )}

        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}>
          <span style={{ fontSize: '14px' }}>🔒</span>
          <span>We've dispatched a confidential 6-digit code. Check your inbox and spam folder.</span>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            margin: '20px 0'
          }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${i + 1} of verification code`}
                style={{
                  width: '48px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f8fafc',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: `2px solid ${digit ? '#6366f1' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: digit ? '0 0 14px rgba(99, 102, 241, 0.35)' : 'none'
                }}
              />
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#9ca3af',
            marginBottom: '24px'
          }}>
            <span>Code expires in: <strong style={{ color: timeLeft < 60 ? '#f43f5e' : '#38bdf8' }}>{formatTime(timeLeft)}</strong></span>
            {onResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendCooldown > 0 ? '#6b7280' : '#818cf8',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600'
                }}
              >
                <RefreshCw size={14} className={isResending ? 'spin' : ''} />
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
              </button>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={fullCode.length !== 6 || isSubmitting}
            style={{ width: '100%', padding: '12px' }}
          >
            {isSubmitting ? 'Verifying...' : 'Verify Code'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
