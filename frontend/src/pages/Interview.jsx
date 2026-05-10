import { AlarmClock, BrainCircuit, CheckCircle2, Crown, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError, interviewApi } from '../services/api.js';

const roles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Python Developer', 'Data Scientist', 'Machine Learning Engineer', 'Software Engineer'];
const levels = ['Junior', 'Mid', 'Senior'];

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

export default function Interview() {
  const [setup, setSetup] = useState({ role: roles[0], experience_level: 'Mid', use_resume: false });
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPremium = user?.plan_type === 'premium';
  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => answer.trim().length > 0).length,
    [answers],
  );

  useEffect(() => {
    if (!session || timer <= 0) return undefined;
    const interval = window.setInterval(() => setTimer((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(interval);
  }, [session, timer]);

  const start = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await interviewApi.start(setup);
      const data = response.data.data;
      setSession(data);
      setTimer(data.time_limit_seconds);
      setAnswers(Object.fromEntries(data.questions.map((question) => [question.id, ''])));
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!session) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        interview_id: session.interview_id,
        answers: session.questions.map((question) => ({
          question_id: question.id,
          answer: answers[question.id] || '',
        })),
      };
      const response = await interviewApi.submit(payload);
      const interviewData = response.data.data;
      // We pass the data to navigation so feedback page shows it immediately
      navigate(`/feedback/${interviewData.interview_id}`, { state: { feedbackData: interviewData } });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="mb-7">
        <p className="label text-cyan-200">Interview Module</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Practice under pressure</h1>
        <p className="mt-2 text-slate-400">Choose a role, answer timed questions, and receive question-wise feedback.</p>
      </div>

      {error ? <p className="mb-4 border border-pink-300/20 bg-pink-300/10 p-3 text-sm text-pink-100" style={{ borderRadius: 12 }}>{error}</p> : null}

      {!session ? (
        <form className="glass-panel max-w-3xl p-6" onSubmit={start}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label mb-2 block">Role</span>
              <select className="input-field" value={setup.role} onChange={(event) => setSetup({ ...setup, role: event.target.value })}>
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label mb-2 block">Experience Level</span>
              <select className="input-field" value={setup.experience_level} onChange={(event) => setSetup({ ...setup, experience_level: event.target.value })}>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-5 flex items-center justify-between gap-4 border border-white/5 bg-slate-950/40 p-6" style={{ borderRadius: 16 }}>
            <span>
              <span className="flex items-center gap-2 font-bold text-white">
                <Crown className="h-5 w-5 text-pink-400" />
                Resume-based interview
              </span>
              <span className="mt-1 block text-sm text-slate-400">Premium only, after uploading a PDF resume.</span>
            </span>
            <input
              className="h-6 w-6 accent-cyan-500 transition-all cursor-pointer"
              type="checkbox"
              checked={setup.use_resume}
              disabled={!isPremium}
              onChange={(event) => setSetup({ ...setup, use_resume: event.target.checked })}
            />
          </label>

          <button className="gradient-button mt-8 h-14 px-10" type="submit" disabled={loading}>
            {loading ? <Spinner label="Generating questions" /> : <><BrainCircuit className="h-5 w-5" /> Start Interview</>}
          </button>
        </form>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            {session.questions.map((question, index) => (
              <article key={question.id} className="glass-panel p-6">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="label">Question {index + 1}</p>
                    <h2 className="mt-2 text-xl font-bold text-white leading-relaxed">{question.question}</h2>
                    <p className="mt-2 text-sm text-slate-400">{question.context}</p>
                  </div>
                  <CheckCircle2 className={`h-6 w-6 shrink-0 transition-colors ${answers[question.id]?.trim() ? 'text-emerald-400' : 'text-slate-700'}`} />
                </div>
                <textarea
                  className="input-field min-h-40 resize-y text-base leading-relaxed"
                  value={answers[question.id] || ''}
                  onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })}
                  placeholder="Type your answer with examples, tradeoffs, and validation steps."
                />
              </article>
            ))}
          </section>

          <aside className="xl:sticky xl:top-24 h-fit space-y-4">
            <div className="glass-panel p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <AlarmClock className="h-6 w-6" />
                </div>
                <div>
                  <p className="label">Time Remaining</p>
                  <p className="text-3xl font-black text-white">{formatTime(timer)}</p>
                </div>
              </div>
              <div className="mb-6 space-y-4 rounded-xl border border-white/5 bg-slate-950/40 p-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>Progress</span>
                    <span>{answeredCount}/{session.questions.length}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-500" 
                      style={{ width: `${(answeredCount / session.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 italic">
                  {isPremium ? 'Premium unlimited access active.' : `Free tier: ${session.remaining_free_attempts ?? 0} attempts left.`}
                </p>
              </div>
              <button 
                className="gradient-button w-full h-14 text-lg shadow-lg shadow-cyan-500/20" 
                type="button" 
                onClick={submit} 
                disabled={submitting || answeredCount === 0}
              >
                {submitting ? <Spinner label="AI Evaluating" /> : <><Send className="h-5 w-5" /> Submit Interview</>}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
