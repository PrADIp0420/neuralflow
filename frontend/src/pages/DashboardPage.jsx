import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isAfter } from 'date-fns';

const priorityColors = { low: 'var(--text-3)', medium: 'var(--cyan)', high: 'var(--amber)', urgent: 'var(--red)' };
const statusColors = { todo: 'var(--text-3)', 'in-progress': 'var(--cyan)', review: 'var(--amber)', done: 'var(--green)' };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => api.get('/tasks/dashboard/stats').then(r => r.data) });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects').then(r => r.data) });

  const getCount = s => stats?.statusStats?.find(x => x._id === s)?.count || 0;
  const total = stats?.statusStats?.reduce((a, s) => a + s.count, 0) || 0;
  const done = getCount('done');
  const progress = total ? Math.round((done / total) * 100) : 0;
  const firstName = user?.name?.split(' ')[0];
  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
            ◆ NeuralFlow Dashboard
          </div>
          <h1 className="page-title">{greeting}, <span style={{ color: 'var(--cyan)' }}>{firstName}</span></h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your team overview</p>
        </div>
        {user?.globalRole === 'admin' && (
          <span className="role-badge role-admin">◆ Global Admin</span>
        )}
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card" style={{ '--accent-color': 'var(--cyan)' }}>
            <div className="stat-label">Workspaces</div>
            <div className="stat-value" style={{ color: 'var(--cyan)' }}>{isLoading ? '—' : stats?.projectCount || 0}</div>
            <FolderKanban size={40} className="stat-icon" style={{ color: 'var(--cyan)' }} />
          </div>
          <div className="stat-card" style={{ '--accent-color': 'var(--green)' }}>
            <div className="stat-label">Completed</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{isLoading ? '—' : done}</div>
            <CheckSquare size={40} className="stat-icon" style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-card" style={{ '--accent-color': 'var(--amber)' }}>
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{isLoading ? '—' : getCount('in-progress')}</div>
            <TrendingUp size={40} className="stat-icon" style={{ color: 'var(--amber)' }} />
          </div>
          <div className="stat-card" style={{ '--accent-color': 'var(--red)' }}>
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: stats?.overdueCount > 0 ? 'var(--red)' : 'inherit' }}>
              {isLoading ? '—' : stats?.overdueCount || 0}
            </div>
            <AlertTriangle size={40} className="stat-icon" style={{ color: 'var(--red)' }} />
          </div>
        </div>

        {total > 0 && (
          <div className="card mb-4" style={{ marginBottom: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Overall Completion</span>
              <span className="mono" style={{ color: 'var(--cyan)', fontSize: 14, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, var(--cyan), var(--teal))`, boxShadow: '0 0 8px var(--cyan-glow)' }} />
            </div>
            <div className="flex gap-3 mt-2 flex-wrap">
              {['todo', 'in-progress', 'review', 'done'].map(s => (
                <span key={s} style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                  <span style={{ color: statusColors[s] }}>●</span> {s}: <strong style={{ color: 'var(--text-2)' }}>{getCount(s)}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 800, fontSize: 14 }}>Assigned to Me</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all <ArrowRight size={12} /></button>
            </div>
            {!stats?.myTasks?.length && (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <CheckSquare size={28} /><p>No active assignments</p>
              </div>
            )}
            {stats?.myTasks?.map(task => {
              const overdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));
              return (
                <div key={task._id} className={`task-card mb-2 ${overdue ? 'overdue' : ''}`} style={{ marginBottom: 8 }}
                  onClick={() => navigate(`/projects/${task.project._id}`)}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColors[task.status], flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title" style={{ marginBottom: 3 }}>{task.title}</div>
                    <div className="task-meta">
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: task.project?.color }} />
                      {task.project?.name}
                      {task.dueDate && <span style={{ color: overdue ? 'var(--red)' : 'var(--text-3)' }}><Clock size={9} style={{ display: 'inline', marginRight: 2 }} />{format(new Date(task.dueDate), 'MMM d')}</span>}
                    </div>
                  </div>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority], flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 800, fontSize: 14 }}>Workspaces</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>View all <ArrowRight size={12} /></button>
            </div>
            {!projects.length && (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <FolderKanban size={28} /><p>No projects yet</p>
              </div>
            )}
            {projects.slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center gap-3" style={{ padding: '8px', borderRadius: 'var(--radius)', cursor: 'pointer', marginBottom: 4, transition: 'background 0.15s' }}
                onClick={() => navigate(`/projects/${p._id}`)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--navy-4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}66`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{p.members?.length} members</div>
                </div>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'var(--navy-4)', color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
