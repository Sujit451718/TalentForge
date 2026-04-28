import { ShieldCheck, UserPlus, Mail, Lock, User, Eye, EyeOff, Target, Rocket } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const passwordMatch = useMemo(
    () => form.confirmPassword.length > 0 && form.password === form.confirmPassword,
    [form.password, form.confirmPassword],
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please confirm your password again.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
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
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-cyan-500/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <section className="relative z-10 flex w-full max-w-6xl mx-4 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 shadow-2xl backdrop-blur-3xl slide-in-up">
        
        {/* Left Side: Register Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center lg:text-left">
              <p className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300 bg-violet-500/10 rounded-full mb-4">
                <Rocket className="h-3.5 w-3.5" />
                Join the platform
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Create an account</h1>
              <p className="text-slate-400">Start your journey to mastering interviews today</p>
            </div>
            
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input 
                    className="w-full border border-white/10 bg-slate-900/50 px-4 py-3.5 pl-11 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 rounded-xl" 
                    value={form.name} 
                    onChange={(event) => setForm({ ...form, name: event.target.value })} 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input 
                    className="w-full border border-white/10 bg-slate-900/50 px-4 py-3.5 pl-11 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 rounded-xl" 
                    type="email" 
                    value={form.email} 
                    onChange={(event) => setForm({ ...form, email: event.target.value })} 
                    placeholder="you@example.com" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      className="w-full border border-white/10 bg-slate-900/50 px-4 py-3.5 pl-11 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 rounded-xl"
                      type={showPassword ? 'text' : 'password'}
                      minLength={6}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="Min 6 chars"
                      required
                    />
                    <button
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300 ml-1">Confirm</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      className={`w-full border bg-slate-900/50 px-4 py-3.5 pl-11 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:ring-4 rounded-xl ${form.confirmPassword && !passwordMatch ? 'border-pink-500/50 focus:border-pink-500/50 focus:ring-pink-500/10' : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/10'}`}
                      type={showConfirmPassword ? 'text' : 'password'}
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                      placeholder="Repeat"
                      required
                    />
                    <button
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match Indicator */}
              {form.confirmPassword && (
                <div className="flex items-center gap-2 mt-1 ml-1 overflow-hidden transition-all duration-300">
                  <div className={`h-1.5 flex-1 rounded-full ${passwordMatch ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                  <div className={`h-1.5 flex-1 rounded-full ${passwordMatch ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                  <div className={`h-1.5 flex-1 rounded-full ${passwordMatch ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ml-2 ${passwordMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordMatch ? 'Match' : 'Waiting'}
                  </span>
                </div>
              )}

              {error ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-sm animate-shake mt-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-pink-400 mt-0.5" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button 
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-4 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_-15px_rgba(34,211,238,0.6)] focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 mt-6" 
                type="submit" 
                disabled={loading || (form.confirmPassword.length > 0 && !passwordMatch)}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100 mix-blend-overlay"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? <Spinner label="Setting up..." /> : <><UserPlus className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /> Complete Registration</>}
                </div>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <Link className="font-semibold text-violet-400 hover:text-violet-300 transition-colors underline decoration-violet-400/30 underline-offset-4" to="/login">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Brand / Visuals */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-bl from-violet-900/40 via-slate-900/40 to-cyan-900/40 border-l border-white/5 relative overflow-hidden order-1 lg:order-2">
          {/* Abstract Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/5 rounded-full flex items-center justify-center">
             <div className="w-[70%] h-[70%] border border-white/10 rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
                <div className="w-[60%] h-[60%] border border-white/10 rounded-full border-dashed"></div>
             </div>
          </div>

          <div className="relative z-10 flex justify-end">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-violet-200 transition-colors">TalentForge</span>
              <div className="rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 p-2 text-white shadow-lg shadow-violet-500/25 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </Link>
          </div>
          
          <div className="relative z-10 mt-auto mb-16 text-right">
            <div className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mb-6 ml-auto shadow-xl floating">
              <Target className="h-10 w-10 text-violet-400" />
            </div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-violet-300 to-cyan-300 mb-6 leading-tight">
              Unlock your <br /> career potential.
            </h2>
            <p className="text-slate-300 text-lg max-w-md ml-auto leading-relaxed">
              Join thousands of candidates who improved their interview skills and landed top jobs.
            </p>
            
            <div className="mt-8 flex items-center justify-end gap-3 text-sm font-medium text-slate-400">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-white">
                    <User className="h-4 w-4" />
                  </div>
                ))}
              </div>
              <span>+2,000 users joined</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
