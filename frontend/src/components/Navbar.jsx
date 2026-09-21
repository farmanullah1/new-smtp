import React, { useState } from 'react';
import { LayoutDashboard, Mail, Activity, User, LogOut, Shield, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'CRUD Dashboard', icon: LayoutDashboard },
    { id: 'templates', label: 'Email Templates', icon: Mail },
    { id: 'diagnostics', label: 'SMTP Diagnostics', icon: Activity },
    { id: 'profile', label: 'User Profile', icon: User }
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        background: 'rgba(10, 15, 29, 0.9)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 20px'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}
      >
        {/* Brand Logo */}
        <button
          onClick={() => handleTabClick('dashboard')}
          aria-label="Go to Dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Shield size={22} color="#ffffff" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: '800',
                fontSize: '17px',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Farmanullah Company
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              SMTP & Auth Suite
            </div>
          </div>
        </button>

        {/* Desktop Navigation Tabs */}
        <nav
          role="navigation"
          aria-label="Main Navigation"
          className="hide-mobile"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 15px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      background: 'var(--accent-primary)',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px var(--accent-primary)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Controls & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User Profile Summary */}
          <button
            onClick={() => handleTabClick('profile')}
            aria-label="View Profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              color: 'inherit'
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
                color: '#ffffff'
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hide-mobile" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                {user?.role || 'user'}
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            aria-label="Sign Out"
            title="Sign Out"
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '8px',
              color: '#fb7185',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
            className="show-mobile"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f8fafc',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.2s ease forwards'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '15px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
