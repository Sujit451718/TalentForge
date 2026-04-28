import { 
  ArrowRight, 
  Award, 
  BarChart3, 
  BrainCircuit, 
  ChevronRight,
  Clock,
  Crown,
  Edit3,
  ExternalLink,
  Mail,
  ShieldCheck, 
  Sparkles, 
  Star,
  Target, 
  UserCircle2,
  Zap
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart
} from 'recharts';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError, userApi } from '../services/api.js';

function StatCard({ label, value, Icon, color, trend }) {
  return (
    <article className="glass-panel group overflow-hidden p-6 transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-3 bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
            <Zap className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-5">
        <p className="text-3xl font-black tracking-tight text-white">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
      </div>
    </article>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser, booting } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (booting) return;
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await userApi.analytics();
        setAnalytics(response.data.data);
        setEditForm({ name: user?.name || '', email: user?.email || '' });
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, booting]);

  const metrics = analytics?.user_metrics || {};
  
  // Use unique quiz IDs to prevent duplication in trend chart
  const quizTrend = useMemo(() => {
    const history = analytics?.quiz_history || [];
    // Ensure uniqueness by ID and take last 7
    const seen = new Set();
    const uniqueHistory = [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (!seen.has(history[i].quiz_id)) {
        seen.add(history[i].quiz_id);
        uniqueHistory.push(history[i]);
      }
    }
    return uniqueHistory.reverse().slice(-7).map((item, index) => ({
      name: `Q${index + 1}`,
      score: item.score || 0,
      ai: item.ai_avg_score || 0,
    }));
  }, [analytics]);

  const resultPie = useMemo(() => [
    { name: 'Correct', value: metrics.latest_correct || 0, color: '#22d3ee' },
    { name: 'Wrong', value: metrics.latest_wrong || 0, color: '#f43f5e' },
  ], [metrics.latest_correct, metrics.latest_wrong]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Assuming a new endpoint or using existing userApi pattern
      // Since I need to create/verify the endpoint, I will use a generic update call
      const response = await userApi.updateProfile(editForm);
      updateUser(response.data.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading || booting) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label="Loading your profile data..." />
    </div>
  );

  if (error) return (
    <div className="page-shell py-20 text-center">
      <div className="glass-panel p-12 inline-block">
        <p className="text-pink-400 mb-4 font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="gradient-button h-12 px-8">Try Again</button>
      </div>
    </div>
  );

  return (
    <main className="page-shell space-y-10">
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-8 slide-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <label className="block">
                <span className="label mb-2 block">Full Name</span>
                <input 
                  className="input-field" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required 
                />
              </label>
              <label className="block">
                <span className="label mb-2 block">Email Address</span>
                <input 
                  className="input-field" 
                  type="email"
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  required 
                />
              </label>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="ghost-button flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="gradient-button flex-1"
                >
                  {updating ? <Spinner label="" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/40 p-8 lg:p-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-3xl border-2 border-cyan-500/20 bg-slate-900 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-slate-800 text-cyan-400">
                  <UserCircle2 className="h-12 w-12" />
                </div>
              </div>
              {user?.plan_type === 'premium' && (
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white lg:text-4xl">{user?.name}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                  user?.plan_type === 'premium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {user?.plan_type}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user?.email}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Joined April 2026</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="ghost-button !px-5"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
            {user?.plan_type !== 'premium' && (
              <Link to="/pricing" className="gradient-button !px-6">
                <Zap className="h-4 w-4" />
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Quizzes" value={metrics.total_quiz_attempts || 0} Icon={BrainCircuit} color="cyan" trend="+12%" />
        <StatCard label="Avg Score" value={`${metrics.average_quiz_score || 0}%`} Icon={Target} color="violet" />
        <StatCard label="AI Rating" value={`${metrics.average_ai_score || 0}%`} Icon={Sparkles} color="pink" trend="Top 5%" />
        <StatCard label="Best Performance" value={`${Math.max(metrics.best_quiz_score || 0, metrics.best_interview_score || 0)}%`} Icon={Award} color="emerald" />
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Progress Charts */}
        <div className="space-y-8 lg:col-span-2">
          <article className="glass-panel p-6">
            <SectionHeader 
              title="Performance Trend" 
              subtitle="Your score progress over the last 7 sessions"
              icon={BarChart3}
            />
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quizTrend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="grid gap-8 md:grid-cols-2">
            <article className="glass-panel p-6">
              <SectionHeader title="Accuracy" subtitle="Recent answer split" icon={Target} />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={resultPie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {resultPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="glass-panel p-6">
              <SectionHeader title="Achievements" subtitle="Earned milestones" icon={Award} />
              <div className="space-y-4">
                {[
                  { title: 'Early Bird', date: 'April 20, 2026', icon: Zap, color: 'text-amber-400' },
                  { title: 'Fast Learner', date: 'April 22, 2026', icon: Sparkles, color: 'text-cyan-400' },
                  { title: 'Top Scorer', date: 'April 25, 2026', icon: Crown, color: 'text-violet-400' },
                ].map((ach) => (
                  <div key={ach.title} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <ach.icon className={`h-5 w-5 ${ach.color}`} />
                      <div>
                        <p className="text-sm font-bold text-white">{ach.title}</p>
                        <p className="text-xs text-slate-400">{ach.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <article className="glass-panel p-6">
            <h3 className="mb-6 text-xl font-bold text-white">Recommended for you</h3>
            <div className="space-y-4">
              <Link to="/quiz" className="flex items-center justify-between rounded-2xl bg-cyan-500/10 p-4 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <BrainCircuit className="h-6 w-6 text-cyan-400" />
                  <div>
                    <p className="font-bold text-white">Practice MCQ</p>
                    <p className="text-xs text-slate-400">Brush up fundamentals</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-cyan-400" />
              </Link>
              <Link to="/interview" className="flex items-center justify-between rounded-2xl bg-violet-500/10 p-4 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <Sparkles className="h-6 w-6 text-violet-400" />
                  <div>
                    <p className="font-bold text-white">AI Interview</p>
                    <p className="text-xs text-slate-400">Simulate real scenarios</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-violet-400" />
              </Link>
            </div>
          </article>

          <article className="glass-panel p-6">
            <h3 className="mb-6 text-xl font-bold text-white">Latest Interviews</h3>
            <div className="space-y-6">
              {(analytics?.interview_history || []).slice(0, 3).map((item, i) => (
                <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-[1px] before:bg-slate-800 last:before:hidden">
                  <div className="absolute left-[-4px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <p className="text-sm font-bold text-white">Completed {item.role} Interview</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <span>Score: {item.score}%</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {!(analytics?.interview_history || []).length && <p className="text-sm text-slate-500">No interviews recorded yet.</p>}
            </div>
          </article>

          <article className="glass-panel p-6">
            <h3 className="mb-6 text-xl font-bold text-white">Quiz History</h3>
            <div className="space-y-6">
              {(analytics?.quiz_history || []).slice(0, 5).map((item, i) => (
                <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-[1px] before:bg-slate-800 last:before:hidden">
                  <div className="absolute left-[-4px] top-1.5 h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <p className="text-sm font-bold text-white capitalize">{item.topic}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Score: {item.score}%</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {!(analytics?.quiz_history || []).length && <p className="text-sm text-slate-500">No quizzes completed yet.</p>}
              <button className="flex w-full items-center justify-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300">
                View All Activity
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </article>

          {user?.role === 'admin' && (
            <Link to="/admin-dashboard" className="flex items-center justify-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4 text-pink-400 transition-all hover:bg-pink-500/20">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold">Admin Control Center</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
