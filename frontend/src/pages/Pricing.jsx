import { CheckCircle2, Crown, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="page-shell relative z-10">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 py-10">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4 slide-in-up">
          <h2 className="text-pink-500 font-black tracking-widest uppercase text-sm">Choose Your Plan</h2>
          <p className="text-5xl sm:text-7xl font-black text-white tracking-tight">
            Unlock the ultimate <br />
            <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">Interview Arsenal.</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          {/* Free Tier */}
          <article className="glass-panel p-12 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 flex flex-col h-full rounded-[2rem] slide-in-left">
            <div className="mb-8">
              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest border border-white/10 mb-6">Basic</span>
              <h3 className="text-4xl font-black text-white mb-2">Free Core</h3>
              <p className="text-slate-400 font-medium text-lg">Start practicing your skills today with essential tools.</p>
            </div>
            <div className="mb-10">
              <span className="text-7xl font-black text-white flex items-baseline">
                <IndianRupee className="h-10 w-10 mb-2 mr-1 opacity-80"/>0
              </span>
              <span className="text-slate-500 font-bold ml-1"> / forever</span>
            </div>
            <div className="space-y-6 flex-1 mb-10">
              {['2 interviews per day', 'Basic question bank', 'Keyword feedback', 'Dashboard stats'].map((feature, i) => (
                <p key={i} className="flex items-center gap-4 text-slate-300 font-medium text-lg">
                  <CheckCircle2 className="h-6 w-6 text-slate-500 shrink-0" />
                  {feature}
                </p>
              ))}
            </div>
            <Link className="ghost-button w-full !h-16 !text-xl !rounded-xl" to={isAuthenticated ? '/dashboard' : '/register'}>
              Continue Free
            </Link>
          </article>

          {/* Premium Tier */}
          <article className="relative glass-panel p-12 border-pink-500/30 bg-gradient-to-b from-pink-500/10 to-violet-900/20 hover:from-pink-500/20 transition-all duration-500 flex flex-col h-full lg:h-[105%] rounded-[2rem] shadow-[0_0_50px_rgba(236,72,153,0.15)] z-10 scale-100 lg:scale-105 slide-in-right">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-50" />
            <div className="mb-8 relative">
              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-500/25 mb-6">Most Popular</span>
              <Crown className="absolute top-8 right-8 h-16 w-16 text-pink-400/20 animate-pulse" />
              <h3 className="text-4xl font-black text-white mb-2">Premium</h3>
              <p className="text-pink-200/70 font-medium text-lg">For serious candidates aiming for top-tier tech roles.</p>
            </div>
            <div className="mb-10">
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400 flex items-baseline">
                <IndianRupee className="h-10 w-10 text-pink-400 mb-2 mr-1"/>749
              </span>
              <span className="text-slate-400 font-bold ml-1"> / month</span>
            </div>
            <div className="space-y-6 flex-1 mb-10">
              {['Unlimited interviews & Battles', 'Advanced AI-style prompts', 'Resume-based interview questions', 'Detailed analytics & ATS Scoring'].map((feature, i) => (
                <p key={i} className="flex items-center gap-4 text-white font-medium text-lg">
                  <CheckCircle2 className="h-6 w-6 text-pink-500 shrink-0 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                  {feature}
                </p>
              ))}
            </div>
            {isAuthenticated && user?.plan_type !== 'premium' ? (
              <Link className="gradient-button w-full !h-16 !text-xl !rounded-xl !from-pink-600 !via-purple-600 !to-violet-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]" to="/payment">
                Proceed to Payment
              </Link>
            ) : !isAuthenticated ? (
              <Link className="gradient-button w-full !h-16 !text-xl !rounded-xl !from-pink-600 !via-purple-600 !to-violet-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]" to="/register">
                Create Account
              </Link>
            ) : (
              <button className="ghost-button w-full !h-16 !text-xl !rounded-xl border-pink-500/50 text-pink-400 bg-pink-500/10 cursor-default" type="button" disabled>
                Premium Active
              </button>
            )}
          </article>
        </div>
      </div>
    </main>
  );
}
