import { 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Sparkles,
  UploadCloud,
  Crosshair,
  Target
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { userApi, getApiError } from '../services/api.js';
import Spinner from '../components/Spinner.jsx';

export default function ATSScore() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const isPremium = user?.plan_type === 'premium';

  const checkScore = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() && !file) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await userApi.atsScore({ resume_text: resumeText, file, target_role: targetRole });
      setResults(response.data.data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <main className="page-shell">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none z-[-1] animate-pulse" />
        
        <div className="glass-panel p-16 text-center max-w-2xl mx-auto zoom-in">
          <div className="relative inline-flex items-center justify-center mx-auto mb-10 group">
            <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full group-hover:bg-pink-500/30 transition-colors" />
            <div className="relative h-24 w-24 bg-pink-500/10 text-pink-400 rounded-3xl flex items-center justify-center border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
              <ShieldCheck className="h-12 w-12" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-6 text-glow">Premium Feature</h1>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed font-medium">
            Advanced ATS Resume Scanning is reserved for our Premium members. Upgrade today to unlock deep keyword analysis, targeted optimization tips, and ensure your resume beats the bots.
          </p>
          <button className="gradient-button w-full sm:w-auto px-12 h-14 text-lg shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]">
            Upgrade to Premium Now
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-10 relative">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen floating" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-screen floating" style={{ animationDelay: '1s' }} />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 slide-in-down">
        <div>
          <p className="label text-cyan-400 flex items-center gap-2">
            <Search className="w-4 h-4" /> Optimization Engine
          </p>
          <h1 className="text-4xl font-black text-white mt-2 text-glow-hover transition-all">ATS Score Analysis</h1>
          <p className="text-slate-400 mt-3 text-lg font-medium">Evaluate and optimize your resume against industry-standard tracking systems.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 border border-white/10 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-xl hover:border-amber-500/30 transition-colors">
          <Zap className="h-5 w-5 text-amber-400 animate-pulse" />
          <span className="text-sm font-black text-white uppercase tracking-widest">Premium Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <section className="space-y-6">
          <article className="glass-panel p-10 animated-card slide-in-left">
            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 border-b border-white/5 pb-6">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <FileText className="h-6 w-6 text-cyan-400" />
              </div>
              Input Resume Data
            </h3>
            
            <div className="mb-8 space-y-3">
              <label className="label block flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-slate-400" /> Target Domain / Role
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <Target className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  className="input-field w-full pl-12 h-14 bg-slate-900/60" 
                  placeholder="e.g. Data Scientist, React Developer, Product Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition-all duration-300 border-2 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5 focus:outline-none border-white/10 bg-slate-900/40 group">
                <div className="flex flex-col items-center space-y-3 text-slate-400 group-hover:text-cyan-300 transition-colors">
                  <UploadCloud className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                  <span className="font-bold">
                    {file ? <span className="text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> {file.name}</span> : "Drop PDF to Analyze, or click to browse"}
                  </span>
                </div>
                <input type="file" name="file_upload" className="hidden" accept=".pdf" onChange={(e) => { setFile(e.target.files[0]); setResumeText(''); }} />
              </label>
            </div>
            
            <div className="flex items-center gap-4 mb-8 opacity-60">
              <div className="h-px bg-white/20 flex-1"></div>
              <span className="text-xs text-slate-400 uppercase font-black tracking-widest px-2">OR Paste Text</span>
              <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <textarea 
              className="input-field min-h-[250px] py-6 px-6 text-base leading-relaxed bg-slate-900/60 resize-y"
              placeholder="Paste your professional experience, skills, and summary here for deep analysis..."
              value={resumeText}
              onChange={(e) => { setResumeText(e.target.value); setFile(null); }}
            />
            
            <button 
              className="gradient-button w-full mt-8 h-16 text-lg tracking-wide shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] group"
              onClick={checkScore}
              disabled={loading || (!resumeText.trim() && !file) || !targetRole.trim()}
            >
              {loading ? (
                <Spinner label="Running Deep Analysis..." />
              ) : (
                <>
                  <Search className="h-5 w-5 transition-transform group-hover:rotate-12" /> 
                  Calculate ATS Score
                </>
              )}
            </button>
            {error && <p className="mt-6 text-pink-400 text-sm font-bold text-center bg-pink-500/10 p-4 rounded-xl border border-pink-500/20 animate-shake">{error}</p>}
          </article>
        </section>

        <aside className="space-y-6">
          {results ? (
            <div className="slide-in-right space-y-6">
              {/* Score Card */}
              <article className="glass-panel p-10 text-center border-t-4 border-t-cyan-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                <p className="label mb-6 flex justify-center items-center gap-2"><Sparkles className="w-4 h-4"/> System Evaluation</p>
                
                <div className="relative inline-flex items-center justify-center mb-6">
                  <svg className="h-40 w-40 -rotate-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                    <circle 
                      cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={439.8}
                      strokeDashoffset={439.8 - (439.8 * results.score) / 100}
                      strokeLinecap="round"
                      className="text-cyan-400 transition-all duration-[1500ms] ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                     <span className="text-5xl font-black text-white text-glow">{Math.round(results.score)}</span>
                     <span className="text-xs font-black text-cyan-400 mt-1 uppercase">Score</span>
                  </div>
                </div>
                
                <h4 className="text-2xl font-black text-white tracking-tight">{results.verdict}</h4>
              </article>

              {/* Found Keywords */}
              <article className="glass-panel p-8 animated-card">
                <h4 className="font-black text-emerald-400 mb-6 flex items-center gap-3 text-lg">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
                  Matched Keywords
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {results.found_keywords.map(kw => (
                    <span key={kw} className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-lg border border-emerald-500/30 shadow-sm transition-transform hover:scale-105">
                      {kw}
                    </span>
                  ))}
                  {!results.found_keywords.length && <p className="text-sm text-slate-500 italic">No matching keywords found for this role.</p>}
                </div>
              </article>

              {/* Missing Keywords */}
              <article className="glass-panel p-8 animated-card">
                <h4 className="font-black text-pink-400 mb-6 flex items-center gap-3 text-lg">
                  <div className="p-1.5 bg-pink-500/20 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
                  Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {results.missing_keywords.slice(0, 10).map(kw => (
                    <span key={kw} className="px-3.5 py-1.5 bg-pink-500/10 text-pink-300 text-xs font-black uppercase tracking-wider rounded-lg border border-pink-500/30 shadow-sm transition-transform hover:scale-105 cursor-help" title="Add this to improve your score">
                      {kw}
                    </span>
                  ))}
                  {!results.missing_keywords.length && <p className="text-sm text-slate-500 italic">Excellent! You hit all major keywords.</p>}
                </div>
              </article>

              {/* Optimization Tips */}
              <article className="glass-panel p-8 animated-card border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-500/5 to-transparent">
                <h4 className="font-black text-white mb-6 flex items-center gap-3 text-lg">
                  <div className="p-1.5 bg-violet-500/20 rounded-lg"><Sparkles className="h-5 w-5 text-violet-400" /></div>
                  Actionable Advice
                </h4>
                <ul className="space-y-4">
                  {results.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-4 text-sm font-medium text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                      <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30 text-violet-400 text-xs font-black">
                        {i + 1}
                      </div>
                      {s}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <article className="glass-panel p-10 text-center py-32 h-full flex flex-col items-center justify-center border-dashed border-2 border-white/10 opacity-70">
              <div className="h-20 w-20 bg-slate-800 text-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>
              <h4 className="font-black text-white mb-3 text-xl">Awaiting Data</h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[250px] mx-auto">Upload a resume and specify your target role to generate a comprehensive ATS report.</p>
            </article>
          )}
        </aside>
      </div>
    </main>
  );
}
