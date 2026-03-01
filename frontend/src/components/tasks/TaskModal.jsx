import { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To-Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/**
 * Modal form for creating and editing tasks
 * @param {Object} task - existing task for edit mode (null for create)
 * @param {Array} members - team members list for assignment dropdown
 */
export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  members = [],
  defaultStatus = 'todo',
}) {
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: defaultStatus,
    priority: 'medium',
    deadline: '',
    blockerReason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form on edit
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        deadline: task.deadline ? task.deadline.slice(0, 10) : '',
        blockerReason: task.blockerReason || '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        assignedTo: '',
        status: defaultStatus,
        priority: 'medium',
        deadline: '',
        blockerReason: '',
      });
    }
    setError('');
  }, [task, isOpen, defaultStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!form.assignedTo) {
      setError('Please assign this task to a team member');
      return;
    }
    if (!form.deadline) {
      setError('Please set a deadline');
      return;
    }
    if (form.status === 'blocked' && !form.blockerReason.trim()) {
      setError('Please describe the blocker');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedTo || null,
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || null,
        blockerReason: form.status === 'blocked' ? form.blockerReason.trim() : '',
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create New Task'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Title <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Task title…" className="input-field" autoFocus />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Description <span style={{ color: '#f87171' }}>*</span>
          </label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the task…" rows={3} className="input-field" style={{ resize: 'none' }} />
        </div>

        {/* Status & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Status <span style={{ color: '#f87171' }}>*</span></label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Priority <span style={{ color: '#f87171' }}>*</span></label>
            <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Assign To <span style={{ color: '#f87171' }}>*</span></label>
          <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input-field">
            <option value="">— Select a member —</option>
            {members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.role})</option>)}
          </select>
        </div>

        {/* Deadline */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Deadline <span style={{ color: '#f87171' }}>*</span></label>
          <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="input-field" />
        </div>

        {/* Blocker reason */}
        {form.status === 'blocked' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Blocker Reason <span style={{ color: '#f87171' }}>*</span>
            </label>
            <textarea name="blockerReason" value={form.blockerReason} onChange={handleChange}
              placeholder="Describe what is blocking this task…" rows={2} className="input-field"
              style={{ resize: 'none', borderColor: 'rgba(251,191,36,0.3)' }} />
          </div>
        )}

        {error && (
          <div style={{ fontSize: '0.78rem', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
