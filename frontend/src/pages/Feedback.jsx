import { Download, Lightbulb, ShieldAlert, Sparkles, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { getApiError, interviewApi } from '../services/api.js';

export default function Feedback() {
  const { interviewId } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await interviewApi.feedback(interviewId);
        setFeedback(response.data.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [interviewId]);

  const downloadReport = () => {
    if (!feedback) return;
    const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `interview-report-${feedback.interview_id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const score = Math.round(feedback?.total_score || 0);

  return (
    <main className="page-shell">
      {/* Background glow specific to this page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-500/10 to-transparent blur-[100px] pointer-events-none z-[-1]" />

      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end slide-in-up">
        <div>
          <p className="label text-violet-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Performance Analysis
          </p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl text-glow">Interview Feedback</h1>
          <p className="mt-3 text-lg text-slate-400">Deep dive into your score, strengths, and areas for growth.</p>
        </div>
        <button className="gradient-button group h-12" type="button" onClick={downloadReport} disabled={!feedback}>
          <Download className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
          Download PDF Report
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-24 flex justify-center items-center zoom-in">
          <Spinner label="Analyzing feedback data..." />
        </div>
      ) : error ? (
        <p className="border border-pink-500/30 bg-pink-500/10 p-6 text-sm text-pink-200 rounded-2xl flex items-center gap-3 animate-shake">
          <ShieldAlert className="h-5 w-5" /> {error}
        </p>
      ) : feedback ? (
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Main Score Card */}
          <section className="glass-panel animated-card p-10 zoom-in relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center relative z-10">
              <div className="text-center md:text-left">
                <p className="label text-slate-300">Overall Assessment Score</p>
                <div className="mt-4 flex items-baseline justify-center md:justify-start gap-2">
                  <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 drop-shadow-lg">
                    {score}<span className="text-4xl">%</span>
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                   <span className="px-4 py-2 bg-slate-800/80 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-cyan-300 shadow-lg">
                     {feedback.role}
                   </span>
                   <span className="px-4 py-2 bg-slate-800/80 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-violet-300 shadow-lg">
                     {feedback.experience_level}
                   </span>
                </div>
              </div>
              <div className="flex-1 w-full max-w-md mx-auto md:mx-0 bg-slate-900/60 p-6 rounded-2xl border border-white/10">
                <div className="mb-4 flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Proficiency Gauge</span>
                  <span className="text-cyan-400">{score} / 100</span>
                </div>
                <div className="h-6 overflow-hidden bg-slate-950 p-1 rounded-full border border-white/5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 rounded-full transition-all duration-1000 relative" style={{ width: `${score}%` }}>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="glass-panel animated-card p-8 slide-in-left border-t-4 border-t-cyan-500">
              <div className="h-12 w-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>
              <p className="label">Questions Answered</p>
              <p className="mt-2 text-3xl font-black text-white">{feedback.analytics?.questions_answered || 0}</p>
            </div>
            <div className="glass-panel animated-card p-8 slide-in-up border-t-4 border-t-emerald-500" style={{ animationDelay: '100ms' }}>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Sparkles className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="label">Best Response Accuracy</p>
              <p className="mt-2 text-3xl font-black text-white">{feedback.analytics?.best_question_score || 0}%</p>
            </div>
            <div className="glass-panel animated-card p-8 slide-in-right border-t-4 border-t-pink-500" style={{ animationDelay: '200ms' }}>
              <div className="h-12 w-12 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                <Lightbulb className="h-6 w-6 text-pink-400" />
              </div>
              <p className="label">Primary Focus Area</p>
              <p className="mt-2 text-base font-bold text-white leading-relaxed capitalize">{feedback.analytics?.focus_area || 'General Practice'}</p>
            </div>
          </section>

          {/* Detailed Summary */}
          {feedback.summary && (
            <section className="p-8 glass-panel animated-card slide-in-up border-l-4 border-l-violet-500">
              <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <BrainCircuit className="h-6 w-6 text-violet-400" /> Executive Summary
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <p className="font-black text-emerald-400 mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 group-hover:animate-pulse"/> Core Strengths
                  </p>
                  <ul className="space-y-3">
                    {feedback.summary.strengths?.map((s, i) => (
                      <li key={i} className="text-sm font-medium text-slate-300 flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                        </div>
                        {s}
                      </li>
                    ))}
                    {!feedback.summary.strengths?.length && <li className="text-sm text-slate-400 italic">Complete more questions for AI assessment.</li>}
                  </ul>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-colors group">
                  <p className="font-black text-pink-400 mb-4 flex items-center gap-2 text-lg">
                    <ShieldAlert className="h-5 w-5 group-hover:animate-shake"/> Areas to Improve
                  </p>
                  <ul className="space-y-3">
                    {feedback.summary.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm font-medium text-slate-300 flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl">
                        <div className="h-5 w-5 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="h-1.5 w-1.5 bg-pink-400 rounded-full" />
                        </div>
                        {w}
                      </li>
                    ))}
                    {!feedback.summary.weaknesses?.length && <li className="text-sm text-slate-400 italic">Complete more questions for AI assessment.</li>}
                  </ul>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                  <p className="font-black text-cyan-400 mb-4 flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 group-hover:animate-bounce"/> Future Focus
                  </p>
                  <ul className="space-y-3">
                    {feedback.summary.future_improvements?.map((f, i) => (
                      <li key={i} className="text-sm font-medium text-slate-300 flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl">
                        <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full" />
                        </div>
                        {f}
                      </li>
                    ))}
                    {!feedback.summary.future_improvements?.length && <li className="text-sm text-slate-400 italic">Complete more questions for AI assessment.</li>}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Question Breakdown */}
          <section className="space-y-8 mt-12">
            <h2 className="text-3xl font-black text-white mb-6">Question Breakdown</h2>
            {feedback.questions.map((item, index) => (
              <article key={item.id || index} className="glass-panel animated-card p-8 slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start bg-slate-900/40 p-6 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <p className="label text-cyan-400">Question {index + 1}</p>
                    <h2 className="mt-3 text-xl font-bold text-white leading-relaxed">{item.question}</h2>
                  </div>
                  <div className="shrink-0 flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-2xl border border-white/10 shadow-lg">
                    <span className="text-xs font-black uppercase text-slate-400 mb-1">Score</span>
                    <span className="text-3xl font-black text-cyan-400 drop-shadow-md">{item.score ?? 0}%</span>
                  </div>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                  <div className="border border-emerald-500/10 bg-emerald-500/5 p-6 rounded-2xl">
                    <p className="mb-5 flex items-center gap-2 font-black text-emerald-400 text-lg">
                      <Sparkles className="h-5 w-5" />
                      What went well
                    </p>
                    <ul className="space-y-4">
                      {(item.strengths || []).map((value, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                          <span className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                             <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                          {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-pink-500/10 bg-pink-500/5 p-6 rounded-2xl">
                    <p className="mb-5 flex items-center gap-2 font-black text-pink-400 text-lg">
                      <ShieldAlert className="h-5 w-5" />
                      What to improve
                    </p>
                    <ul className="space-y-4">
                      {(item.weaknesses || []).map((value, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                          <span className="h-5 w-5 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                             <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                          </span>
                          {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {item.jarvis_response && (
                  <div className="mb-6 border border-cyan-500/20 bg-cyan-500/5 p-6 rounded-2xl">
                    <p className="label mb-4 text-cyan-300 flex items-center gap-2">
                       <BrainCircuit className="w-4 h-4" /> Jarvis Feedback
                    </p>
                    <p className="text-sm font-medium text-slate-300 italic">
                      "{item.jarvis_response}"
                    </p>
                  </div>
                )}
                
                <div className="mt-6 border border-violet-500/20 bg-violet-500/5 p-8 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                     <Lightbulb className="w-24 h-24 text-violet-400" />
                  </div>
                  <div className="relative z-10">
                    <p className="label mb-4 text-violet-300 flex items-center gap-2">
                       <Lightbulb className="w-4 h-4" /> Ideal Answer Strategy
                    </p>
                    <p className="text-base leading-relaxed font-medium text-slate-200">
                      {item.suggested_answer || 'Complete more questions to see AI suggestions.'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      ) : null}
    </main>
  );
}
