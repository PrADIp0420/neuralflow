import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, ChevronRight, Plus, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import CreateProjectModal from './CreateProjectModal';
import NeuralFlowLogo from './NeuralFlowLogo';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects').then(r => r.data) });
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => api.get('/tasks/dashboard/stats').then(r => r.data) });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.7)', zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <NeuralFlowLogo size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-name">NeuralFlow</div>
            <div className="brand-tagline">by Ethara AI</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <FolderKanban size={15} /> Projects
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <CheckSquare size={15} /> My Tasks
            {stats?.overdueCount > 0 && <span className="nav-badge">{stats.overdueCount}</span>}
          </NavLink>

          {projects.length > 0 && (
            <>
              <div className="nav-section">Workspaces</div>
              {projects.slice(0, 6).map(p => (
                <NavLink key={p._id} to={`/projects/${p._id}`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <span className="proj-dot" style={{ background: p.color || 'var(--cyan)', boxShadow: `0 0 6px ${p.color || 'var(--cyan)'}66` }} />
                  <span className="truncate" style={{ maxWidth: 130 }}>{p.name}</span>
                  <ChevronRight size={11} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                </NavLink>
              ))}
            </>
          )}

          <button className="nav-link" style={{ marginTop: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: 'var(--border)', borderRadius: 'var(--radius)', width: '100%', justifyContent: 'flex-start' }}
            onClick={() => { setShowCreate(true); setSidebarOpen(false); }}>
            <Plus size={13} /> New Workspace
          </button>
        </div>

        <div className="cyber-line" />
        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontSize: 13, fontWeight: 700 }}>{user?.name}</div>
              <div className="truncate" style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>
                {user?.globalRole === 'admin' ? '◆ ADMIN' : '◇ MEMBER'}
              </div>
            </div>
            <button className="btn-ghost btn" style={{ padding: 6 }} onClick={() => { logout(); navigate('/login'); }} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {/* Mobile topbar */}
        <div style={{ display: 'none', padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 12, background: 'var(--navy-2)', position: 'sticky', top: 0, zIndex: 50 }} className="mobile-topbar">
          <button className="btn-ghost btn" onClick={() => setSidebarOpen(true)} style={{ padding: 6 }}><Menu size={18} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="brand-logo" style={{ width: 26, height: 26, borderRadius: 6 }}><NeuralFlowLogo size={14} /></div>
            <strong style={{ fontSize: 14 }}>NeuralFlow</strong>
            <span style={{ fontSize: 9, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>by Ethara AI</span>
          </div>
        </div>
        <Outlet />
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
      <style>{`@media(max-width:768px){.mobile-topbar{display:flex!important}}`}</style>
    </div>
  );
}
