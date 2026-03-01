import { useState } from 'react';
import Modal from '../common/Modal';
import { teamsAPI } from '../../services/api';

/**
 * Modal for creating a new team
 */
export function CreateTeamModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Team name is required');
    setLoading(true);
    setError('');
    try {
      const { data } = await teamsAPI.create(form);
      onCreated(data);
      onClose();
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Team">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Team Name <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Hackathon Alpha" className="input-field" autoFocus />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Description</label>
          <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What is this team working on?" className="input-field" />
        </div>
        {error && (
          <div style={{ fontSize: '0.78rem', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>{loading ? 'Creating…' : 'Create Team'}</button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal for joining an existing team via invite code
 */
export function JoinTeamModal({ isOpen, onClose, onJoined }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return setError('Invite code is required');
    setLoading(true);
    setError('');
    try {
      const { data } = await teamsAPI.join(inviteCode.trim().toUpperCase());
      onJoined(data);
      onClose();
      setInviteCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join a Team">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Ask your team lead for the 8-character invite code.
        </p>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Invite Code <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="A1B2C3D4"
            className="input-field"
            style={{ fontFamily: 'monospace', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}
            maxLength={8}
            autoFocus
          />
        </div>
        {error && (
          <div style={{ fontSize: '0.78rem', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>{loading ? 'Joining…' : 'Join Team'}</button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
