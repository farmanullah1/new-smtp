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
  onClose,
  debugOtp
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expiryMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimeLeft(expiryMinutes * 60);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen, expiryMinutes]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle pasting whole 6 digit code
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const char = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = digits.join('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (fullCode.length !== 6 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onVerify(fullCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isResending || !onResend) return;
    try {
      setIsResending(true);
      await onResend();
      setTimeLeft(expiryMinutes * 60);
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
        textAlign: 'center'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <ShieldCheck size={28} color="#818cf8" />
        </div>

        <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>{title}</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          {subtitle} {email && <strong style={{ color: '#f1f5f9' }}>{email}</strong>}
        </p>

        {debugOtp && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px dashed rgba(99, 102, 241, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#a5b4fc'
          }}>
            Developer Mode Code: <strong style={{ letterSpacing: '2px', color: '#ffffff' }}>{debugOtp}</strong>
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
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: '46px',
                  height: '54px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f8fafc',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: `2px solid ${digit ? '#6366f1' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: digit ? '0 0 12px rgba(99, 102, 241, 0.3)' : 'none'
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
                disabled={isResending}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600'
                }}
              >
                <RefreshCw size={14} className={isResending ? 'spin' : ''} /> Resend
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
