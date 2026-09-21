import React from 'react';
import { LayoutDashboard, Mail, Activity, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'CRUD Dashboard', icon: LayoutDashboard },
    { id: 'templates', label: 'Email Templates', icon: Mail },
    { id: 'diagnostics', label: 'SMTP Diagnostics', icon: Activity },
    { id: 'profile', label: 'User Profile', icon: User }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      background: 'rgba(10, 15, 29, 0.85)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              fontSize: '17px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Farmanullah Company
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              SMTP & Auth Suite
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#818cf8' : '#94a3b8',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              color: '#ffffff'
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                {user?.role || 'user'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
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
        </div>
      </div>
    </header>
  );
};
