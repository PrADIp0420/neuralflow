import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';
import InviteMemberModal from '../components/InviteMemberModal';
import { format, isAfter } from 'date-fns';

const COLS = [
  { id: 'todo',        label: 'To Do',      color: 'var(--text-3)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--cyan)'   },
  { id: 'review',      label: 'Review',      color: 'var(--amber)'  },
  { id: 'done',        label: 'Done',        color: 'var(--green)'  },
];

const priorityColors = { low: 'var(--text-3)', medium: 'var(--cyan)', high: 'var(--amber)', urgent: 'var(--red)' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('board');
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskCol, setNewTaskCol] = useState('todo');

  const { data: project, isLoading: pLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks?project=${id}`).then(r => r.data)
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => api.put(`/tasks/${taskId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', id] }),
    onError: err => toast.error(err.response?.data?.message || 'Update failed')
  });

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); navigate('/projects'); toast.success('Project deleted'); }
  });

  const removeMember = useMutation({
    mutationFn: uid => api.delete(`/projects/${id}/members/${uid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', id] }); toast.success('Member removed'); }
  });

  if (pLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!project) return <div className="page-content"><p>Project not found</p></div>;

  const isAdmin = project.userRole === 'admin' || user?.globalRole === 'admin';
  const byStatus = COLS.reduce((a, c) => { a[c.id] = tasks.filter(t => t.status === c.id); return a; }, {});
  const progress = tasks.length ? Math.round((byStatus.done?.length / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}><ArrowLeft size={13} /> Back</button>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: project.color, boxShadow: `0 0 10px ${project.color}88` }} />
            <h1 className="page-title" style={{ fontSize: 20 }}>{project.name}</h1>
            {isAdmin && <span className="role-badge role-admin">Admin</span>}
          </div>
          {project.description && <p className="page-subtitle" style={{ marginLeft: 80 }}>{project.description}</p>}
          <div style={{ marginTop: 10, maxWidth: 280, marginLeft: 80 }}>
            <div className="flex items-center justify-between" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 5 }}>
              <span>{tasks.length} tasks</span>
              <span style={{ color: 'var(--cyan)' }}>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${project.color}, var(--teal))`, boxShadow: `0 0 6px ${project.color}66` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}><UserPlus size={13} /> Invite</button>}
          <button className="btn btn-primary btn-sm" onClick={() => { setNewTaskCol('todo'); setShowCreate(true); }}><Plus size={13} /> Add Task</button>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm('Delete this project and all tasks?')) deleteProject.mutate(); }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="tabs">
          {['board', 'list', 'members'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* KANBAN BOARD */}
        {tab === 'board' && (
          <div className="kanban-board">
            {COLS.map(col => (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <div className="kanban-col-title">
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, boxShadow: `0 0 5px ${col.color}` }} />
                    {col.label}
                    <span className="col-count">{byStatus[col.id]?.length || 0}</span>
                  </div>
                  <button className="btn btn-ghost" style={{ padding: 3 }} onClick={() => { setNewTaskCol(col.id); setShowCreate(true); }}>
                    <Plus size={13} />
                  </button>
                </div>

                {byStatus[col.id]?.map(task => {
                  const overdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));
                  return (
                    <div key={task._id} className="kanban-task" onClick={() => setSelectedTask(task)}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.assignee && <div className="avatar xs">{task.assignee.name?.[0]}</div>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, color: 'var(--text-1)' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div style={{ display: 'flex', gap: 4 }}>
                          {task.tags?.slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'var(--cyan-dim)', color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{tag}</span>
                          ))}
                        </div>
                        {task.dueDate && (
                          <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {/* Status toggle bar */}
                      <div style={{ display: 'flex', gap: 3, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                        {COLS.map(c => (
                          <button key={c.id} title={c.label} style={{ flex: 1, height: 2, border: 'none', cursor: 'pointer', borderRadius: 1, background: task.status === c.id ? c.color : 'var(--border)', opacity: task.status === c.id ? 1 : 0.4, boxShadow: task.status === c.id ? `0 0 4px ${c.color}` : 'none' }}
                            onClick={() => updateTask.mutate({ taskId: task._id, data: { status: c.id } })} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {!byStatus[col.id]?.length && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
                    — empty —
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {tab === 'list' && (
          <div>
            {!tasks.length && <div className="empty-state"><p>No tasks yet</p></div>}
            {COLS.map(col => {
              const colTasks = byStatus[col.id];
              if (!colTasks?.length) return null;
              return (
                <div key={col.id} style={{ marginBottom: 24 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, boxShadow: `0 0 5px ${col.color}` }} />
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 1, color: col.color }}>{col.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{colTasks.length}</span>
                  </div>
                  {colTasks.map(task => {
                    const overdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));
                    return (
                      <div key={task._id} className={`task-card ${overdue ? 'overdue' : ''}`} style={{ marginBottom: 6 }} onClick={() => setSelectedTask(task)}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority], flexShrink: 0, marginTop: 5 }} />
                        <div className="task-card-body" style={{ flex: 1 }}>
                          <div className="task-title">{task.title}</div>
                          <div className="task-meta">
                            {task.assignee && <span>{task.assignee.name}</span>}
                            {task.dueDate && <span style={{ color: overdue ? 'var(--red)' : 'inherit' }}>Due {format(new Date(task.dueDate), 'MMM d')}</span>}
                            {task.tags?.slice(0, 2).map(t => <span key={t} style={{ color: 'var(--cyan)' }}>#{t}</span>)}
                          </div>
                        </div>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <div style={{ maxWidth: 560 }}>
            {project.members?.map(m => (
              <div key={m.user._id} className="card flex items-center gap-3" style={{ marginBottom: 10 }}>
                <div className="avatar">{m.user.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.user.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{m.user.email}</div>
                </div>
                <span className={`role-badge ${m.role === 'admin' ? 'role-admin' : 'role-member'}`}>{m.role}</span>
                {isAdmin && m.user._id !== project.owner && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '5px' }}
                    onClick={() => removeMember.mutate(m.user._id)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            {isAdmin && (
              <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowInvite(true)}>
                <UserPlus size={14} /> Invite Member
              </button>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <TaskModal projectId={id} defaultStatus={newTaskCol} members={project.members} onClose={() => setShowCreate(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['tasks', id] }); setShowCreate(false); }} />
      )}
      {selectedTask && (
        <TaskModal task={selectedTask} projectId={id} members={project.members} isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['tasks', id] }); setSelectedTask(null); }}
          onDeleted={() => { qc.invalidateQueries({ queryKey: ['tasks', id] }); setSelectedTask(null); }} />
      )}
      {showInvite && (
        <InviteMemberModal projectId={id} existingMembers={project.members}
          onClose={() => setShowInvite(false)}
          onInvited={() => qc.invalidateQueries({ queryKey: ['project', id] })} />
      )}
    </div>
  );
}
