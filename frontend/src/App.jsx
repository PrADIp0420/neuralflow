import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TasksPage from './pages/TasksPage';
import './index.css';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

const Protected = ({ children }) => { const { user, loading } = useAuth(); if (loading) return <div className="loading-screen"><div className="spinner" /></div>; return user ? children : <Navigate to="/login" replace />; };
const Public = ({ children }) => { const { user, loading } = useAuth(); if (loading) return <div className="loading-screen"><div className="spinner" /></div>; return user ? <Navigate to="/dashboard" replace /> : children; };

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { background: '#0a1628', color: '#e8f4ff', border: '1px solid #1a2d4a', fontFamily: 'Outfit, sans-serif', fontSize: '13px' } }} />
          <Routes>
            <Route path="/login"  element={<Public><LoginPage /></Public>} />
            <Route path="/signup" element={<Public><SignupPage /></Public>} />
            <Route path="/" element={<Protected><Layout /></Protected>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"    element={<DashboardPage />} />
              <Route path="projects"     element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="tasks"        element={<TasksPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
