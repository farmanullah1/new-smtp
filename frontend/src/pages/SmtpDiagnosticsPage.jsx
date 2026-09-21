import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Mail, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getHealth, sendTestEmail } from '../api/user';
import { useToast } from '../components/Toast';

export const SmtpDiagnosticsPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('farmanullahansari999@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const toast = useToast();

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await getHealth();
      setHealth(res);
    } catch (err) {
      toast.error('Failed to load system diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast.error('Recipient email address is required');
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);
      const res = await sendTestEmail(testEmailAddress);
      setTestResult(res);
      toast.success(res.message || 'Test email dispatched successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch test email');
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>SMTP & System Diagnostics</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Real-time server infrastructure status, database connectivity, and live SMTP delivery testing
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Status
        </button>
      </div>

      {/* Diagnostics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Backend API Server Status */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700' }}>
              <Server size={20} color="#818cf8" /> API Backend Server
            </div>
            <span className="badge badge-success">Operational</span>
          </div>

          <table style={{ width: '100%', fontSize: '13px', borderSpacing: '0 8px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#94a3b8' }}>Uptime:</td>
                <td style={{ color: '#f8fafc', fontWeight: '600', textAlign: 'right' }}>
                  {health ? `${health.uptimeSeconds} seconds` : '...'}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Environment:</td>
                <td style={{ color: '#38bdf8', fontWeight: '600', textAlign: 'right', textTransform: 'capitalize' }}>
                  {health?.environment || 'development'}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>API Mount:</td>
                <td style={{ color: '#f8fafc', fontFamily: 'monospace', textAlign: 'right' }}>
                  /api/v1
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Database Connection Status */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700' }}>
              <Database size={20} color="#34d399" /> Database Layer
            </div>
            <span className="badge badge-success">
              {health?.database?.status === 'healthy' ? 'Connected' : 'Degraded'}
            </span>
          </div>

          <table style={{ width: '100%', fontSize: '13px', borderSpacing: '0 8px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#94a3b8' }}>Engine / Dialect:</td>
                <td style={{ color: '#34d399', fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' }}>
                  {health?.database?.dialect || 'mssql'}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Database Name:</td>
                <td style={{ color: '#f8fafc', fontFamily: 'monospace', textAlign: 'right' }}>
                  {health?.database?.name || 'newDatabaseHAiBro'}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Driver:</td>
                <td style={{ color: '#f8fafc', textAlign: 'right' }}>
                  Sequelize (Microsoft SQL Server)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SMTP Transporter Status */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700' }}>
              <Mail size={20} color="#38bdf8" /> SMTP Transporter
            </div>
            <span className={`badge ${health?.smtp?.status === 'connected' ? 'badge-success' : 'badge-warning'}`}>
              {health?.smtp?.status === 'connected' ? 'Verified Ready' : 'Standby'}
            </span>
          </div>

          <table style={{ width: '100%', fontSize: '13px', borderSpacing: '0 8px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#94a3b8' }}>SMTP Host:</td>
                <td style={{ color: '#f8fafc', fontFamily: 'monospace', textAlign: 'right' }}>
                  {health?.smtp?.host}:{health?.smtp?.port}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Sender Address:</td>
                <td style={{ color: '#38bdf8', fontSize: '12px', textAlign: 'right' }}>
                  {health?.smtp?.user}
                </td>
              </tr>
              <tr>
                <td style={{ color: '#94a3b8' }}>Engine:</td>
                <td style={{ color: '#f8fafc', textAlign: 'right' }}>
                  Nodemailer (Gmail Transport)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Test Email Sender Card */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Send size={20} color="#818cf8" /> Live SMTP Email Delivery Test
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Trigger a real email transmission using your configured SMTP credentials and the <code>test-email.handlebars</code> template.
        </p>

        <form onSubmit={handleSendTest} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', maxWidth: '640px' }}>
          <input
            type="email"
            className="form-input"
            placeholder="Enter recipient email address..."
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            style={{ flex: 1, minWidth: '280px' }}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={sendingTest}>
            {sendingTest ? 'Sending via SMTP...' : 'Dispatch Test Email'} <Send size={16} />
          </button>
        </form>

        {testResult && (
          <div style={{
            marginTop: '24px',
            padding: '16px 20px',
            borderRadius: '10px',
            background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: '700', color: testResult.success ? '#34d399' : '#fb7185' }}>
              {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {testResult.success ? 'Email Delivered Successfully' : 'Delivery Error'}
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
              {testResult.message || testResult.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
