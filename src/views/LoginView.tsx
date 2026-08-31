import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calculator, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

type Mode = 'signin' | 'register' | 'forgot';

export const LoginView: React.FC = () => {
  const { user, appUser, login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  React.useEffect(() => {
    if (user && appUser) {
      if (appUser.role === 'super_admin') {
        navigate(from === '/' ? '/superadmin/dashboard' : from, { replace: true });
      } else {
        if (from.startsWith('/superadmin')) {
          navigate('/', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    }
  }, [user, appUser, navigate, from]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await register({
          email,
          password,
          name,
          companyName
        });
        // Let the useEffect handle the redirection to prevent race conditions
      } else if (mode === 'signin') {
        await login(email, password);
        // Let the useEffect handle the redirection to prevent race conditions
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('Password reset email dispatched! If an account is associated with this email address, instructions will arrive in your inbox shortly.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL || "demo@woodcost.com";
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
    if (!demoPassword) {
      setError("Demo credentials are not configured in the environment.");
      setLoading(false);
      return;
    }
    
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      try {
        await login(demoEmail, demoPassword);
      } catch (loginErr: any) {
        // If demo user doesn't exist yet, auto-create
        await register({
          email: demoEmail,
          password: demoPassword,
          name: "Demo Manager",
          companyName: "Wood Costing Demo Corp"
        });
      }
    } catch (err: any) {
      setError(err.message || "Could not sign in with demo account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-neutral-100">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md">
            <Calculator size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-neutral-900 tracking-tight mb-2">
          {mode === 'forgot' ? 'Reset Password' : mode === 'register' ? 'Create Workspace' : 'Sign in to ERP'}
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-6">
          {mode === 'forgot' 
            ? 'Enter your account email address to receive a password reset link.' 
            : mode === 'register' 
            ? 'Create a new tenant organization to start using the ERP.' 
            : 'Enter your credentials to access your workspace.'}
        </p>
        
        {mode !== 'forgot' && (
          <div className="flex justify-center mb-6 border-b border-neutral-200">
            <button 
              type="button" 
              onClick={() => { setMode('signin'); setError(''); setMessage(''); }} 
              className={`text-sm font-medium pb-2 px-4 border-b-2 transition-colors ${mode === 'signin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
            >
              Sign In
            </button>
            <button 
              type="button" 
              onClick={() => { setMode('register'); setError(''); setMessage(''); }} 
              className={`text-sm font-medium pb-2 px-4 border-b-2 transition-colors ${mode === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
            >
              Register New
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-6 border border-red-200 flex items-start gap-2">
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm mb-6 border border-emerald-200 flex items-start gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>{message}</div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email address</label>
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                placeholder="you@company.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                {mode === 'signin' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} 
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 text-sm shadow-sm"
          >
            {loading ? 'Processing...' : (
              mode === 'forgot' ? 'Send Password Reset Link' : mode === 'register' ? 'Create Workspace' : 'Sign in'
            )}
          </button>
        </form>

        {mode === 'signin' && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium py-2 px-3 rounded-lg border border-neutral-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Explore Demo Workspace (1-Click Sign In)</span>
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};


