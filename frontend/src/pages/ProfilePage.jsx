import React, { useState, useEffect } from 'react';
import { User, Shield, Lock, Mail, AlertTriangle, KeyRound, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword, toggleTwoFactor, getLoginHistory, deleteAccount } from '../api/user';
import { requestEmailChange, verifyEmailChange } from '../api/auth';
import { useToast } from '../components/Toast';
import { OtpModal } from '../components/OtpModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change Form
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA state
  const [is2FA, setIs2FA] = useState(user?.isTwoFactorEnabled || false);
  const [toggling2FA, setToggling2FA] = useState(false);

  // Email Change State
  const [emailChangeData, setEmailChangeData] = useState({ newEmail: '', currentPassword: '' });
  const [emailChangeOtpModal, setEmailChangeOtpModal] = useState({ isOpen: false, newEmail: '' });
  const [requestingEmailChange, setRequestingEmailChange] = useState(false);

  // Login History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Delete Account
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || ''
      });
      setIs2FA(user.isTwoFactorEnabled || false);
    }
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await getLoginHistory(5);
        setHistory(res.history || []);
      } catch {
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await updateProfile(profileData);
      updateUser(res.user);
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    try {
      setSavingPassword(true);
      await updatePassword(passwords);
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setToggling2FA(true);
      const newStatus = !is2FA;
      await toggleTwoFactor(newStatus);
      setIs2FA(newStatus);
      updateUser({ isTwoFactorEnabled: newStatus });
      toast.success(`Two-Factor Authentication is now ${newStatus ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to toggle 2FA');
    } finally {
      setToggling2FA(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    try {
      setRequestingEmailChange(true);
      const res = await requestEmailChange(emailChangeData);
      toast.success(res.message || 'Verification code sent to new email address');
      setEmailChangeOtpModal({
        isOpen: true,
        newEmail: emailChangeData.newEmail
      });
    } catch (err) {
      toast.error(err.message || 'Failed to request email change');
    } finally {
      setRequestingEmailChange(false);
    }
  };

  const handleVerifyEmailChange = async (code) => {
    try {
      const res = await verifyEmailChange({ code });
      toast.success(res.message || 'Email address successfully updated');
      updateUser(res.user);
      setEmailChangeOtpModal({ isOpen: false, newEmail: '' });
      setEmailChangeData({ newEmail: '', currentPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Verification failed');
      throw err;
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password is required to confirm deletion');
      return;
    }
    try {
      setDeletingAccount(true);
      await deleteAccount(deletePassword);
      toast.success('Your account has been deleted permanently.');
      logout();
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>User Account & Security</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Manage your personal profile, security credentials, 2FA, and authentication audit logs
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Profile Details Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <User size={20} color="#818cf8" /> Personal Profile
          </h2>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 555-0199"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://ik.imagekit.io/frmn/avatar.png"
                value={profileData.avatarUrl}
                onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-textarea"
                placeholder="Brief summary about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ width: '100%' }}>
              {savingProfile ? 'Saving Details...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Lock size={20} color="#818cf8" /> Security & Password
          </h2>

          {/* 2FA Toggle */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} color="#38bdf8" /> Two-Factor Authentication
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Requires a 6-digit email OTP on every login attempt
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`btn btn-sm ${is2FA ? 'btn-danger' : 'btn-primary'}`}
            >
              {is2FA ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={savingPassword} style={{ width: '100%' }}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Email Address & Change Section */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Mail size={20} color="#818cf8" /> Account Email Address
        </h2>

        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
          Current verified address: <strong style={{ color: '#f8fafc' }}>{user?.email}</strong>
        </p>

        <form onSubmit={handleRequestEmailChange} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', alignItems: 'end' }}>
          <div>
            <label className="form-label">New Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="new.email@example.com"
              value={emailChangeData.newEmail}
              onChange={(e) => setEmailChangeData({ ...emailChangeData, newEmail: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={emailChangeData.currentPassword}
              onChange={(e) => setEmailChangeData({ ...emailChangeData, currentPassword: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={requestingEmailChange} style={{ height: '44px' }}>
            {requestingEmailChange ? 'Sending...' : 'Request Email Change'}
          </button>
        </form>
      </div>

      {/* Login History Audit Log */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Clock size={20} color="#818cf8" /> Recent Login History
        </h2>

        {loadingHistory ? (
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>Loading sign-in history...</div>
        ) : history.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>No recorded logins found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Timestamp</th>
                  <th style={{ padding: '10px' }}>IP Address</th>
                  <th style={{ padding: '10px' }}>Client Device</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px', color: '#f8fafc' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', color: '#38bdf8', fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '10px', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.userAgent || 'Web Browser'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {log.status === 'success' ? (
                        <span className="badge badge-success"><CheckCircle2 size={11} /> Success</span>
                      ) : (
                        <span className="badge badge-danger"><XCircle size={11} /> Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="glass-panel" style={{
        padding: '24px',
        marginTop: '24px',
        borderColor: 'rgba(244, 63, 94, 0.3)',
        background: 'rgba(244, 63, 94, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ color: '#fb7185', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <AlertTriangle size={18} /> Danger Zone: Delete Account
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              Permanently delete your user account and all associated resources.
            </p>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Email Change OTP Modal */}
      <OtpModal
        isOpen={emailChangeOtpModal.isOpen}
        title="Confirm New Email Address"
        subtitle="Please enter the 6-digit confirmation code dispatched to"
        email={emailChangeOtpModal.newEmail}
        onVerify={handleVerifyEmailChange}
        onClose={() => setEmailChangeOtpModal({ isOpen: false, newEmail: '' })}
      />

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '24px', textAlign: 'center' }}>
            <AlertTriangle size={36} color="#fb7185" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Confirm Permanent Deletion</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '18px' }}>
              Please enter your password to confirm that you wish to close this account permanently.
            </p>

            <input
              type="password"
              className="form-input"
              placeholder="Enter current password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{ flex: 1 }}
              >
                {deletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
