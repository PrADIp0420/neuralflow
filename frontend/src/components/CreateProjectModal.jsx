import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FolderPlus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#00d4ff','#00ffc8','#7c5cff','#ff4560','#ffb020','#00e87a','#3b82f6','#f97316'];

export default function CreateProjectModal({ onClose }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', color: '#00d4ff', dueDate: '' });
  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: data => api.post('/projects', data),
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Workspace created!');
      onClose();
      navigate(`/projects/${res.data._id}`);
    },
    onError: err => {
      if (err.response?.data?.errors) { const e = {}; err.response.data.errors.forEach(x => { e[x.path] = x.msg; }); setErrors(e); }
      else toast.error(err.response?.data?.message || 'Failed to create');
    }
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 4 }}>◆ NEW WORKSPACE</div>
            <h2 className="modal-title">Create Project</h2>
          </div>
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={17} /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); setErrors({}); createMutation.mutate({ ...form, dueDate: form.dueDate || undefined }); }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. LLM Dataset Pipeline Q2"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} placeholder="What's this project about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: form.color === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'all 0.15s', boxShadow: form.color === c ? `0 0 12px ${c}88` : 'none' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date (optional)</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--navy-2)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, border: '1px solid var(--border)', borderTop: `2px solid ${form.color}` }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 3 }}>PREVIEW</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: form.name ? 'var(--text-1)' : 'var(--text-3)' }}>
              {form.name || 'Project Name'}
            </div>
          </div>

          <div className="flex gap-2 justify-between">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? <span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'var(--navy)' }} /> : <FolderPlus size={14} />}
              {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
