import { ShieldCheck, LogIn, Mail, Lock, Zap, BrainCircuit, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden pt-32 pb-10">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-cyan-500/20 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <section className="relative z-10 flex w-full max-w-5xl mx-4 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 shadow-2xl backdrop-blur-3xl slide-in-up">
        {/* Left Side: Brand / Visuals */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-cyan-900/40 via-slate-900/40 to-violet-900/40 border-r border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
             <BrainCircuit className="w-64 h-64 text-cyan-300 floating" />
          </div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 p-2 text-white shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">TalentForge</span>
            </Link>
          </div>
          
          <div className="relative z-10 mt-12 mb-auto pt-16">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300 mb-6 leading-tight">
              Master your next <br /> interview with AI.
            </h2>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              Practice realistically, get instant feedback, and improve your chances of landing your dream job.
            </p>
            
            <div className="mt-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm transition-transform hover:translate-x-2">
                <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-300">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-slate-200 font-medium">Real-time dynamic questions</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm transition-transform hover:translate-x-2">
                <div className="bg-violet-500/20 p-2 rounded-lg text-violet-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-slate-200 font-medium">Advanced ATS resume scoring</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center lg:text-left">
              <p className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 rounded-full mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                Welcome back
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Sign in to account</h1>
              <p className="text-slate-400">Enter your credentials to access your dashboard</p>
            </div>
            
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    className="w-full border border-white/10 bg-slate-900/50 px-4 py-3.5 pl-11 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 rounded-xl"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <a href="#" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Forgot password?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    className="w-full border border-white/10 bg-slate-900/50 px-4 py-3.5 pl-11 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 rounded-xl"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-sm animate-shake">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-pink-400 mt-0.5" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button 
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-4 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-15px_rgba(139,92,246,0.6)] focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100" 
                type="submit" 
                disabled={loading}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100 mix-blend-overlay"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? <Spinner label="Authenticating..." /> : <><LogIn className="h-5 w-5 transition-transform group-hover:translate-x-1" /> Sign In</>}
                </div>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400">
                Don't have an account?{' '}
                <Link className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-cyan-400/30 underline-offset-4" to="/register">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
