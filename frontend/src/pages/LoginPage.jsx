import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import NeuralFlowLogo from '../components/NeuralFlowLogo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); toast.success('Welcome back to NeuralFlow!'); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-logo" style={{ width: 44, height: 44, borderRadius: 11 }}>
            <NeuralFlowLogo size={24} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>NeuralFlow</div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)', letterSpacing: 2 }}>BY ETHARA AI</div>
          </div>
        </div>

        <h2 className="auth-title">Sign in</h2>
        <p className="auth-subtitle">Access your AI-powered workspace</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          {error && <div className="form-error mb-2">{error}</div>}
          <button className="btn btn-primary w-full btn-lg" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--navy)' }} /> : <LogIn size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
          New to NeuralFlow?{' '}
          <Link to="/signup" style={{ color: 'var(--cyan)', fontWeight: 700 }}>Create account →</Link>
        </p>

        <div className="ethara-tag">
          Powered by <span>Ethara AI</span> — Bridging AI & Real-World Applications
        </div>
      </div>
    </div>
  );
}
