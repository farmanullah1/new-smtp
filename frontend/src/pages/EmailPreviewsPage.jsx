import React, { useState } from 'react';
import { Mail, Smartphone, Monitor, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';

export const EmailPreviewsPage = () => {
  const templates = [
    {
      id: 'signup-verification',
      name: 'Signup Verification',
      badge: 'Auth Onboarding',
      desc: 'Sent immediately upon user signup containing the 6-digit verification code.'
    },
    {
      id: 'welcome',
      name: 'Welcome Email',
      badge: 'Activation',
      desc: 'Dispatched once user confirms their email address with active role metadata.'
    },
    {
      id: 'login-alert',
      name: 'Login Security Alert',
      badge: 'Security',
      desc: 'Sent upon successful sign-in with IP address, device type, and recovery link.'
    },
    {
      id: 'otp-verification',
      name: 'OTP Verification (2FA)',
      badge: 'Security',
      desc: 'Generic and two-factor authentication security passcode delivery.'
    },
    {
      id: 'password-reset',
      name: 'Password Recovery',
      badge: 'Recovery',
      desc: 'Recovery code dispatched when user initiates a forgot password request.'
    },
    {
      id: 'password-changed',
      name: 'Password Changed Notice',
      badge: 'Security',
      desc: 'Critical security notice confirming account password update with emergency CTA.'
    },
    {
      id: 'email-change-request',
      name: 'Email Change Confirmation',
      badge: 'Account',
      desc: 'Dispatched to the newly requested email address with authorization OTP.'
    },
    {
      id: 'email-changed-notice',
      name: 'Email Changed Advisory',
      badge: 'Security',
      desc: 'Security advisory dispatched to previous email warning of address change.'
    },
    {
      id: 'account-deleted',
      name: 'Account Closure',
      badge: 'Account',
      desc: 'Confirmation that all user records, sessions, and items were removed.'
    },
    {
      id: 'test-email',
      name: 'SMTP Diagnostics Test',
      badge: 'System',
      desc: 'System health test email verifying Nodemailer host, port, and DB connectivity.'
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState('signup-verification');
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [iframeKey, setIframeKey] = useState(0);

  const previewUrl = `/api/v1/previews/${selectedTemplate}`;

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Handlebars Email Templates</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Live interactive rendering of all 10 responsive email templates using <code>main.handlebars</code>
          </p>
        </div>

        {/* Viewport Switcher & Reload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => setDeviceMode('desktop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: deviceMode === 'desktop' ? 'var(--gradient-brand)' : 'transparent',
                color: deviceMode === 'desktop' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Monitor size={15} /> Desktop
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: deviceMode === 'mobile' ? 'var(--gradient-brand)' : 'transparent',
                color: deviceMode === 'mobile' ? '#ffffff' : '#94a3b8',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Smartphone size={15} /> Mobile (375px)
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Refresh Preview"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <ExternalLink size={14} /> Open in Tab
          </a>
        </div>
      </div>

      {/* Main Layout: Template Catalog Sidebar + Live Viewer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Template Catalog */}
        <div className="glass-panel" style={{ padding: '16px', maxHeight: '800px', overflowY: 'auto' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Available Templates ({templates.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {templates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? 'var(--border-highlight)' : 'transparent'}`,
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: isSelected ? '#ffffff' : '#e2e8f0' }}>
                      {tpl.name}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#93c5fd'
                    }}>
                      {tpl.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    {tpl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Screen Container */}
        <div className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.95)',
          minHeight: '750px'
        }}>
          <div style={{
            width: deviceMode === 'mobile' ? '375px' : '100%',
            maxWidth: deviceMode === 'mobile' ? '375px' : '700px',
            height: '700px',
            borderRadius: deviceMode === 'mobile' ? '28px' : '12px',
            border: deviceMode === 'mobile' ? '8px solid #334155' : '1px solid #334155',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.3s ease',
            background: '#f1f5f9'
          }}>
            <iframe
              key={iframeKey + selectedTemplate}
              src={previewUrl}
              title={`Preview of ${selectedTemplate}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#f1f5f9'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
