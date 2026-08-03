import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Trash2, Save } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function TaskModal({ task, projectId, defaultStatus = 'todo', members = [], isAdmin, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || defaultStatus,
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || task?.assignee || '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    tags: task?.tags?.join(', ') || ''
  });
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  const saveMutation = useMutation({
    mutationFn: data => isEdit ? api.put(`/tasks/${task._id}`, data) : api.post('/tasks', { ...data, project: projectId }),
    onSuccess: () => { toast.success(isEdit ? 'Task updated!' : 'Task created!'); onSaved?.(); },
    onError: err => {
      if (err.response?.data?.errors) { const e = {}; err.response.data.errors.forEach(x => { e[x.path] = x.msg; }); setErrors(e); }
      else toast.error(err.response?.data?.message || 'Save failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task._id}`),
    onSuccess: () => { toast.success('Task deleted'); onDeleted?.(); }
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${task._id}/comments`, { text: comment }),
    onSuccess: () => { toast.success('Comment added'); setComment(''); onSaved?.(); }
  });

  const handleSave = e => {
    e.preventDefault(); setErrors({});
    saveMutation.mutate({
      ...form,
      assignee: form.assignee || null,
      dueDate: form.dueDate || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    });
  };

  const canDelete = isAdmin || task?.createdBy?._id === user?._id || task?.createdBy === user?._id;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 4 }}>
              {isEdit ? '◆ EDIT TASK' : '◆ NEW TASK'}
            </div>
            <h2 className="modal-title">{isEdit ? task.title : 'Create Task'}</h2>
          </div>
          <div className="flex gap-2">
            {isEdit && canDelete && (
              <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete this task?')) deleteMutation.mutate(); }}>
                <Trash2 size={13} />
              </button>
            )}
            <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="What needs to be done?"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Add details, context, or acceptance criteria..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user._id || m.user} value={m.user._id || m.user}>{m.user.name || 'Member'}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-input" placeholder="frontend, api, bug, feature..."
              value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-between">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <span className="spinner" style={{ width: 13, height: 13, borderTopColor: 'var(--navy)' }} /> : <Save size={14} />}
              {saveMutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>

        {isEdit && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 1, marginBottom: 12 }}>
              ◆ COMMENTS ({task.comments?.length || 0})
            </div>
            {task.comments?.map(c => (
              <div key={c._id} className="flex gap-3" style={{ marginBottom: 14 }}>
                <div className="avatar sm">{c.user?.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{c.user?.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, background: 'var(--navy-2)', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <input className="form-input" placeholder="Write a comment..." value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) commentMutation.mutate(); }}
                style={{ flex: 1 }} />
              <button className="btn btn-secondary" disabled={!comment.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>Post</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
