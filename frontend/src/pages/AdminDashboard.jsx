import { 
  Users, 
  BrainCircuit, 
  CreditCard, 
  Activity, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from 'recharts';
import Spinner from '../components/Spinner.jsx';
import { userApi, getApiError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function StatCard({ label, value, subValue, trend, icon: Icon, color }) {
  const isPositive = trend > 0;
  return (
    <article className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl p-3 bg-${color}-500/10 text-${color}-400`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-5">
        <h3 className="text-3xl font-black text-white">{value}</h3>
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className="mt-2 text-xs text-slate-500">{subValue}</p>
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const { user, booting } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const iconMap = {
    Users: Users,
    BrainCircuit: BrainCircuit,
    CreditCard: CreditCard,
    Activity: Activity
  };

  useEffect(() => {
    if (booting || !user || user.role !== 'admin') return;
    
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await userApi.adminStats();
        setStats(response.data.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user, booting]);

  const chartData = [
    { name: 'Mon', users: 4, interviews: 2 },
    { name: 'Tue', users: 7, interviews: 5 },
    { name: 'Wed', users: 5, interviews: 8 },
    { name: 'Thu', users: 9, interviews: 4 },
    { name: 'Fri', users: 12, interviews: 7 },
    { name: 'Sat', users: 8, interviews: 3 },
    { name: 'Sun', users: 15, interviews: 6 },
  ];

  if (loading || booting) return <div className="flex min-h-screen items-center justify-center"><Spinner label="Accessing Control Center..." /></div>;
  
  if (error) return (
    <div className="page-shell flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel p-10 text-center max-w-md">
        <AlertCircle className="h-12 w-12 text-pink-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="gradient-button w-full">
          Re-authenticate
        </button>
      </div>
    </div>
  );

  return (
    <main className="page-shell space-y-8">
      {/* Admin Header */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black text-white">System Monitoring</h1>
          </div>
          <p className="mt-2 text-slate-400">Real-time overview of platform activity and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="input-field !py-2.5 !pl-10 !text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="ghost-button !py-2.5 !text-xs">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(stats?.metrics || []).map((stat, i) => (
          <StatCard key={i} {...stat} Icon={iconMap[stat.icon] || Activity} />
        ))}
      </section>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="glass-panel p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">User Growth</h3>
              <p className="text-sm text-slate-400">New registrations (Demo Data)</p>
            </div>
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-panel p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Interview Activity</h3>
              <p className="text-sm text-slate-400">Sessions per day (Demo Data)</p>
            </div>
            <BarChart3 className="h-5 w-5 text-violet-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="interviews" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* User Management Table (Real Data) */}
      <article className="glass-panel overflow-hidden">
        <div className="border-b border-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Platform Users</h3>
            <span className="text-sm font-semibold text-slate-400">Showing {stats?.users?.length || 0} users</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Interviews</th>
                <th className="px-6 py-4">Avg Score</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(stats?.users || []).filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((user, i) => (
                <tr key={i} className="group hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 border border-white/10">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${user.plan === 'Premium' ? 'font-bold text-amber-400' : 'text-slate-400'}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 font-medium">{user.count}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${user.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white">{user.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-500 hover:text-white transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}
