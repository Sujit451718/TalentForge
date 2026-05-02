import { BarChart3, BrainCircuit, Crown, FileText, RefreshCw, Rocket, Target, Timer, TrendingUp, Trophy, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import UpgradeModal from '../components/UpgradeModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError, userApi } from '../services/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const { user, updateUser } = useAuth();

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, leadRes, analyticsRes] = await Promise.all([
        userApi.dashboard(),
        userApi.leaderboard(),
        userApi.analytics()
      ]);
      setStats({ ...dashRes.data.data, ...analyticsRes.data.data });
      if (leadRes.data.data.leaderboard) {
        setLeaderboard(leadRes.data.data.leaderboard);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const upgrade = async () => {
    setUpgrading(true);
    setNotice('');
    try {
      const response = await userApi.upgradePlan();
      updateUser({ ...user, plan_type: response.data.data.plan_type });
      setNotice('Premium unlocked. Resume interviews and unlimited practice are active.');
      setUpgradeOpen(false);
      await loadDashboard();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUpgrading(false);
    }
  };

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setNotice('');
    try {
      const response = await userApi.uploadResume(file);
      setNotice(`Resume processed. ${response.data.data.questions.length} personalized questions are ready.`);
      await loadDashboard();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // Mock data for Advanced Analytics
  const MOCK_LEADERBOARD = [
    { id: 1, name: 'AlexTheDev', score: 12450, rank: 'Diamond', avatar: 'A' },
    { id: 2, name: 'CodeNinja99', score: 11200, rank: 'Diamond', avatar: 'C' },
    { id: 3, name: 'ByteMe', score: 9800, rank: 'Gold', avatar: 'B' },
    { id: 4, name: 'ReactMaster', score: 8750, rank: 'Gold', avatar: 'R' },
    { id: 5, name: 'BugSquasher', score: 7200, rank: 'Silver', avatar: 'S' },
  ];
  
  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [];

  const quizHistory = stats?.quiz_history || [];
  
  let topicMap = {};
  quizHistory.forEach(q => {
    const topic = q.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { total: 0, count: 0 };
    topicMap[topic].total += q.score || 0;
    topicMap[topic].count += 1;
  });
  let derivedTopicData = Object.keys(topicMap).map(t => ({
    name: t,
    score: Math.round(topicMap[t].total / topicMap[t].count)
  })).sort((a,b) => b.score - a.score).slice(0, 5);
  
  let derivedAccuracyData = quizHistory.slice().reverse().map((q, idx) => ({
    name: `Q${idx + 1}`,
    accuracy: q.score || 0,
    average: q.ai_avg_score || 0
  }));

  let wins = quizHistory.filter(q => (q.score || 0) >= 50).length;
  let losses = quizHistory.length - wins;
  let derivedWinLossData = [
    { name: 'Wins', value: wins, color: '#10b981' },
    { name: 'Losses', value: losses, color: '#f43f5e' },
  ];
  
  const finalTopicData = derivedTopicData;
  const finalAccuracyData = derivedAccuracyData;
  const finalWinLossData = derivedWinLossData;
  const totalWins = wins;
  const totalLosses = losses;
  const winRate = totalWins + totalLosses > 0 ? Math.round((totalWins/(totalWins+totalLosses))*100) : 0;

  const latestInterview = stats?.interview_history?.find(i => i.summary);
  const latestSummary = latestInterview?.summary;

  return (
    <main className="page-shell">
      {/* Deep animated background effect */}
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen floating" />
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen floating" style={{ animationDelay: '2s' }} />
      </div>

      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end slide-in-left">
        <div>
          <p className="label text-cyan-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Command Center
          </p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl text-glow-hover transition-all cursor-default">Welcome back, {stats?.name || user?.name || 'Candidate'}</h1>
          <p className="mt-3 text-lg text-slate-400">Your personalized telemetry and battle metrics.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="ghost-button group h-12 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]" type="button" onClick={loadDashboard}>
            <RefreshCw className="h-4 w-4 transition-transform duration-1000 group-hover:rotate-180" />
            Refresh
          </button>
          <Link className="gradient-button h-12 px-8 from-cyan-500 via-blue-500 to-indigo-500" to="/interview">
            <Rocket className="h-4 w-4" />
            Interview
          </Link>
          <Link className="gradient-button h-12 px-8 from-pink-500 via-orange-500 to-yellow-500 animate-pulse hover:animate-none" to="/jarvis">
            <BrainCircuit className="h-4 w-4" />
            Jarvis Mode
          </Link>
          <Link className="gradient-button h-12 px-8" to="/quiz">
            <Trophy className="h-4 w-4" />
            Arena
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-24 flex flex-col justify-center items-center gap-4 zoom-in">
          <Spinner label="Syncing telemetry..." />
        </div>
      ) : (
        <div className="fade-in">
          {error ? <p className="mb-6 border border-pink-500/30 bg-pink-500/10 p-4 text-sm text-pink-200 rounded-2xl animate-shake flex items-center gap-2"><Target className="w-4 h-4"/> {error}</p> : null}
          {notice ? <p className="mb-6 border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 rounded-2xl zoom-in flex items-center gap-2"><Crown className="w-4 h-4"/> {notice}</p> : null}

          {/* Account Status */}
          <div className="mb-10 slide-in-up">
            {user?.plan_type === 'premium' || stats?.plan_type === 'premium' ? (
              <div className="glass-panel p-8 border-violet-500/30 bg-violet-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110">
                  <Crown className="w-32 h-32 text-violet-400" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 translate-x-[-100%] group-hover:animate-shimmer" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-2">
                      <Crown className="w-6 h-6 text-violet-400 group-hover:animate-bounce" />
                      Premium Account Active
                    </h3>
                    <p className="text-slate-300">Upload your latest resume to calibrate the AI with your real-world experience.</p>
                  </div>
                  <div>
                    <input type="file" id="resume-upload" accept=".pdf" className="hidden" onChange={uploadResume} disabled={uploading} />
                    <label htmlFor="resume-upload" className={`gradient-button px-8 py-4 cursor-pointer inline-flex items-center gap-2 from-violet-600 via-fuchsia-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {uploading ? (
                        <><RefreshCw className="w-5 h-5 animate-spin" /> Processing Data...</>
                      ) : (
                        <><Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> Upload Resume (PDF)</>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 border-slate-700 bg-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-cyan-500/30">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
                  <p className="text-slate-400">Upgrade to Premium to unlock Resume Intelligence, Jarvis Mode, and unlimited practice.</p>
                </div>
                <button onClick={() => setUpgradeOpen(true)} className="gradient-button px-8 py-3 from-cyan-500 to-blue-500 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                  <Crown className="w-4 h-4 mr-2" /> Upgrade Now
                </button>
              </div>
            )}
          </div>

          {/* Core KPIs */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-10">
            {[
              { icon: Target, label: "Accuracy Rate", value: `${stats?.user_metrics?.average_quiz_score ?? stats?.average_score ?? 84}%`, hint: "Overall Score", tone: "cyan" },
              { icon: TrendingUp, label: "Total Battles", value: stats?.user_metrics?.total_quiz_attempts ?? stats?.total_interviews ?? 46, hint: "Recorded matches", tone: "green" },
              { icon: Timer, label: "Avg Response", value: "1.2s", hint: "Lightning fast ⚡", tone: "violet" },
              { icon: Crown, label: "Rank", value: "Diamond 💎", hint: "Highest tier achieved", tone: "rose" }
            ].map((stat, i) => (
              <div key={i} className="slide-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          {/* Advanced Analytics Charts */}
          <div className="grid gap-8 xl:grid-cols-3 mb-10">
            {/* Main Accuracy Area Chart */}
            <section className="glass-panel p-8 xl:col-span-2 animated-card zoom-in">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-cyan-400" /></div>
                    Accuracy Trend
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Your performance vs AI peer average</p>
                </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={finalAccuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="average" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" name="Peer Avg" animationDuration={2000} />
                    <Area type="monotone" dataKey="accuracy" stroke="#22d3ee" strokeWidth={4} fillOpacity={1} fill="url(#colorAccuracy)" name="Your Score" activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Win/Loss Ratio */}
            <section className="glass-panel p-8 animated-card flex flex-col zoom-in" style={{ animationDelay: '100ms' }}>
              <h3 className="text-xl font-black text-white flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg"><Trophy className="h-5 w-5 text-yellow-400" /></div>
                Win/Loss Ratio
              </h3>
              <p className="text-sm text-slate-400 mb-8 font-medium">Battle arena performance</p>
              
              <div className="flex-1 h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={finalWinLossData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none" animationDuration={2000}>
                      {finalWinLossData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-white text-glow">{winRate}%</span>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-widest mt-1">Win Rate</span>
                </div>
              </div>
              
              <div className="flex justify-center gap-8 mt-6 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="text-center group">
                  <p className="text-3xl font-black text-emerald-400 group-hover:scale-110 transition-transform">{totalWins}</p>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-widest">Wins</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center group">
                  <p className="text-3xl font-black text-pink-500 group-hover:scale-110 transition-transform">{totalLosses}</p>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-widest">Losses</p>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-8 xl:grid-cols-3">
            {/* Topic Wise Performance */}
            <section className="glass-panel p-8 animated-card slide-in-up">
              <h3 className="text-xl font-black text-white flex items-center gap-3 mb-8">
                <div className="p-2 bg-violet-500/10 rounded-lg"><BrainCircuit className="h-5 w-5 text-violet-400" /></div>
                Topic Mastery
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalTopicData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fill: '#e2e8f0', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} width={100} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                    <Bar dataKey="score" radius={[0, 12, 12, 0]} barSize={28} animationDuration={2000}>
                      {finalTopicData.map((_, index) => <Cell key={`cell-${index}`} fill={`url(#barGrad${index})`} />)}
                    </Bar>
                    <defs>
                      {finalTopicData.map((_, index) => (
                        <linearGradient key={`grad-${index}`} id={`barGrad${index}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent Activity Log */}
            <section className="glass-panel p-8 animated-card flex flex-col slide-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg"><FileText className="h-5 w-5 text-pink-400" /></div>
                  Recent Battles
                </h3>
                <Link className="ghost-button h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-full" to="/feedback">All Logs</Link>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {(stats?.quiz_history || stats?.recent_interviews || []).slice(0, 4).map((item) => (
                  <div key={item.id || item.quiz_id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                         <Rocket className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white capitalize group-hover:text-cyan-300 transition-colors">{item.topic || item.role}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-emerald-400 drop-shadow-md">{item.score || 0}%</p>
                    </div>
                  </div>
                ))}
                
                {!(stats?.quiz_history || stats?.recent_interviews || []).length && (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-50">
                    <Rocket className="h-16 w-16 text-slate-600 mb-6 animate-pulse" />
                    <p className="text-sm font-bold text-slate-400">Awaiting your first battle.</p>
                  </div>
                )}
              </div>
            </section>
            
            {/* Global Leaderboard Panel */}
            <section className="glass-panel p-8 animated-card flex flex-col slide-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg"><Crown className="h-5 w-5 text-yellow-400" /></div>
                  Global Top 5
                </h3>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                {displayLeaderboard.map((player, idx) => (
                  <div key={player.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-yellow-500/30 hover:bg-slate-800/80 transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${idx === 0 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : idx === 1 ? 'bg-slate-300/20 border-slate-300/50 text-slate-300' : idx === 2 ? 'bg-amber-600/20 border-amber-600/50 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                        <span className="text-sm font-black">{idx + 1}</span>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-white font-black text-lg border border-white/10 group-hover:scale-110 transition-transform">
                        {player.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">{player.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{player.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-emerald-400 drop-shadow-sm">{player.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} loading={upgrading} onClose={() => setUpgradeOpen(false)} onConfirm={upgrade} />
    </main>
  );
}
