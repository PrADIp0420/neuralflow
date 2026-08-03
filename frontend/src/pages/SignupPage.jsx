import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import NeuralFlowLogo from '../components/NeuralFlowLogo';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors(''); setLoading(true);
    try { await signup(form.name, form.email, form.password); toast.success('Welcome to NeuralFlow! 🚀'); navigate('/dashboard'); }
    catch (err) {
      if (err.response?.data?.errors) { const errs = {}; err.response.data.errors.forEach(e => { errs[e.path] = e.msg; }); setErrors(errs); }
      else setErrors({ general: err.response?.data?.message || 'Signup failed' });
    } finally { setLoading(false); }
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

        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join your team's AI-powered workspace</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Alex Johnson"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          {errors.general && <div className="form-error mb-2">{errors.general}</div>}
          <button className="btn btn-primary w-full btn-lg" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--navy)' }} /> : <UserPlus size={16} />}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 700 }}>Sign in →</Link>
        </p>
        <div className="ethara-tag">Powered by <span>Ethara AI</span> — Leading AI & Data Services</div>
      </div>
    </div>
  );
}
