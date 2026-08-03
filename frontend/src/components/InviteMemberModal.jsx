import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, UserPlus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function InviteMemberModal({ projectId, existingMembers, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/members`, { email, role }),
    onSuccess: () => { toast.success(`${email} added to workspace!`); onInvited?.(); onClose(); },
    onError: err => setError(err.response?.data?.message || 'Failed to invite')
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 4 }}>◆ TEAM MANAGEMENT</div>
            <h2 className="modal-title">Invite Member</h2>
          </div>
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={17} /></button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>
          The user must already have a NeuralFlow account. Enter their email to add them.
        </p>

        <form onSubmit={e => { e.preventDefault(); setError(''); inviteMutation.mutate(); }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="colleague@etharaai.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member — can create and edit tasks</option>
              <option value="admin">Admin — full project management access</option>
            </select>
          </div>

          {existingMembers?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="form-label" style={{ marginBottom: 8 }}>Current Members</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {existingMembers.map(m => (
                  <span key={m.user._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--navy-2)', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)' }}>
                    <div className="avatar xs">{m.user.name?.[0]}</div>
                    {m.user.name}
                    <span className={`role-badge ${m.role === 'admin' ? 'role-admin' : 'role-member'}`} style={{ fontSize: 8 }}>{m.role}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="flex gap-2 justify-between">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? <span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'var(--navy)' }} /> : <UserPlus size={14} />}
              {inviteMutation.isPending ? 'Inviting...' : 'Add to Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
