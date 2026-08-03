import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, Calendar } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import CreateProjectModal from '../components/CreateProjectModal';

const statusColors = { active: 'var(--green)', 'on-hold': 'var(--amber)', completed: 'var(--cyan)', archived: 'var(--text-3)' };

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data)
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>◆ Workspaces</div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} active workspace{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Workspace
        </button>
      </div>

      <div className="page-content">
        {isLoading && <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

        {!isLoading && projects.length === 0 && (
          <div className="empty-state">
            <FolderKanban size={48} />
            <h3>No workspaces yet</h3>
            <p>Create your first project to start collaborating</p>
            <button className="btn btn-primary mt-3" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Workspace
            </button>
          </div>
        )}

        <div className="projects-grid">
          {projects.map(p => (
            <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
              {/* Top color bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: p.color || 'var(--cyan)', boxShadow: `0 0 12px ${p.color || 'var(--cyan)'}66` }} />

              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}88`, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase' }}>workspace</span>
                </div>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: statusColors[p.status] + '18', color: statusColors[p.status], fontFamily: 'var(--mono)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', border: `1px solid ${statusColors[p.status]}33` }}>
                  {p.status}
                </span>
              </div>

              <div className="project-card-name">{p.name}</div>
              <div className="project-card-desc">{p.description || 'No description provided'}</div>

              <div className="flex items-center gap-3" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 14 }}>
                <span className="flex items-center gap-2"><Users size={10} /> {p.members?.length}</span>
                {p.dueDate && <span className="flex items-center gap-2"><Calendar size={10} /> {format(new Date(p.dueDate), 'MMM d, yyyy')}</span>}
              </div>

              {/* Member avatars */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {p.members?.slice(0, 5).map((m, i) => (
                  <div key={i} className="avatar xs" style={{ marginLeft: i > 0 ? -6 : 0, border: '1.5px solid var(--navy-3)', zIndex: 5 - i }}>
                    {m.user?.name?.[0] || '?'}
                  </div>
                ))}
                {p.members?.length > 5 && (
                  <div className="avatar xs" style={{ marginLeft: -6, background: 'var(--navy-4)', color: 'var(--text-3)', border: '1.5px solid var(--border)', fontSize: 8 }}>
                    +{p.members.length - 5}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
