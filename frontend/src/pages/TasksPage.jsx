import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Filter } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isAfter } from 'date-fns';
import TaskModal from '../components/TaskModal';

const priorityColors = { low: 'var(--text-3)', medium: 'var(--cyan)', high: 'var(--amber)', urgent: 'var(--red)' };

export default function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '' });
  const [selectedTask, setSelectedTask] = useState(null);

  const params = new URLSearchParams();
  params.set('assignee', user._id);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.overdue === 'true') params.set('overdue', 'true');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', filters],
    queryFn: () => api.get(`/tasks?${params}`).then(r => r.data)
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>◆ My Tasks</div>
          <h1 className="page-title">Assigned to Me</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} requiring your attention</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap" style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--navy-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Filter size={13} style={{ color: 'var(--text-3)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', letterSpacing: 1, textTransform: 'uppercase' }}>Filter</span>
          </div>
          <select className="form-select" style={{ width: 'auto', padding: '5px 32px 5px 10px', fontSize: 12 }}
            value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '5px 32px 5px 10px', fontSize: 12 }}
            value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
            <input type="checkbox" checked={filters.overdue === 'true'} onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked ? 'true' : '' }))} style={{ accentColor: 'var(--red)' }} />
            Overdue only
          </label>
          {(filters.status || filters.priority || filters.overdue) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', overdue: '' })}>Clear</button>
          )}
        </div>

        {isLoading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
        {!isLoading && tasks.length === 0 && (
          <div className="empty-state">
            <CheckSquare size={48} />
            <h3>No tasks found</h3>
            <p>Tasks assigned to you appear here</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(task => {
            const overdue = task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));
            return (
              <div key={task._id} className={`task-card ${overdue ? 'overdue' : ''}`}
                style={{ cursor: 'pointer', borderLeft: `3px solid ${priorityColors[task.priority]}` }}
                onClick={() => setSelectedTask(task)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 5 }}>
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {overdue && <span className="badge" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,69,96,0.2)' }}>OVERDUE</span>}
                  </div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    {task.project && (
                      <span className="flex items-center gap-2">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.project.color }} />
                        {task.project.name}
                      </span>
                    )}
                    {task.dueDate && <span style={{ color: overdue ? 'var(--red)' : 'var(--text-3)' }}>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
                <div className="avatar sm">{task.assignee?.name?.[0]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} projectId={selectedTask.project?._id}
          onClose={() => setSelectedTask(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); setSelectedTask(null); }}
          onDeleted={() => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); setSelectedTask(null); }} />
      )}
    </div>
  );
}
