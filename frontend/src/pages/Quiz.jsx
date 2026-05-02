import { ArrowRight, BrainCircuit, CheckCircle2, ChevronRight, CircleCheck, CircleX, Clock, Crown, Flame, Heart, ListChecks, Medal, Play, RefreshCw, Settings2, Shield, Snowflake, Sparkles, Star, Swords, Target, Timer, Trophy, Volume2, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Spinner from '../components/Spinner.jsx';
import { getApiError, interviewApi } from '../services/api.js';

// --- Sound Utility ---
function playSound(type) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (type === 'correct') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'powerup') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'gameover') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
  } else {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
}

// --- Mock Leaderboard Data (Fallback) ---
const MOCK_LEADERBOARD = [
  { id: 1, name: 'AlexTheDev', score: 12450, rank: 'Diamond', avatar: 'A' },
  { id: 2, name: 'CodeNinja99', score: 11200, rank: 'Diamond', avatar: 'C' },
  { id: 3, name: 'ByteMe', score: 9800, rank: 'Gold', avatar: 'B' },
  { id: 4, name: 'ReactMaster', score: 8750, rank: 'Gold', avatar: 'R' },
  { id: 5, name: 'BugSquasher', score: 7200, rank: 'Silver', avatar: 'S' },
];

export default function Quiz() {
  const navigate = useNavigate();
  
  // High-Level View State
  const [gameState, setGameState] = useState('lobby'); // 'lobby' | 'playing' | 'result'
  
  // Lobby Setup State
  const [domain, setDomain] = useState('Software Engineering');
  const [customDomain, setCustomDomain] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);
  
  // Game Data
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState('');
  
  // Battle State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [health, setHealth] = useState(3);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [powerups, setPowerups] = useState({ fiftyFifty: 1, doubleScore: 1, freeze: 1 });
  const [activePowerup, setActivePowerup] = useState(null); 
  const [eliminatedOptions, setEliminatedOptions] = useState({}); 
  const [shakeHealth, setShakeHealth] = useState(false);
  
  // Timer State (10 minutes = 600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Anti-Cheat State
  const [warnings, setWarnings] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const MAX_WARNINGS = 3;

  useEffect(() => {
    loadHistory();
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { userApi } = await import('../services/api.js');
      const response = await userApi.leaderboard();
      if (response.data.data.leaderboard) {
        setLeaderboard(response.data.data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    }
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !isTimerPaused) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (gameState === 'playing' && timeLeft <= 0) {
      // Time's up
      playSound('gameover');
      submit();
    }
  }, [gameState, timeLeft, isTimerPaused]);

  // --- Death Logic ---
  useEffect(() => {
    if (gameState === 'playing' && health <= 0) {
      playSound('gameover');
      submit();
    }
  }, [health, gameState]);

  const loadHistory = async () => {
    try {
      const response = await interviewApi.quizHistory();
      setHistory(response.data.data.attempts || []);
    } catch {
      setHistory([]);
    }
  };

  // --- Anti-Cheat Logic ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'playing' && !showCheatWarning) {
        // User switched tabs or minimized!
        const newWarnings = warnings + 1;
        setWarnings(newWarnings);
        
        playSound('wrong'); // Play bad sound
        
        if (newWarnings >= MAX_WARNINGS) {
          setHealth(0); // Instant death
          setNotice("Battle forfeit due to multiple tab-switching violations.");
        } else {
          setShowCheatWarning(true);
          setIsTimerPaused(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameState, warnings, showCheatWarning]);

  const dismissCheatWarning = () => {
    setShowCheatWarning(false);
    setIsTimerPaused(false);
  };

  const startBattle = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    setLastResult(null);
    setHealth(3);
    setStreak(0);
    setScore(0);
    setPowerups({ fiftyFifty: 1, doubleScore: 1, freeze: 1 });
    setActivePowerup(null);
    setEliminatedOptions({});
    setSelected({});
    setCurrentQuestionIndex(0);
    setTimeLeft(600); // Reset timer to 10 minutes
    setIsTimerPaused(false);
    setWarnings(0);
    setShowCheatWarning(false);
    
    try {
      const actualTopic = domain === 'Custom' ? customDomain : domain;
      // We pass difficulty inside the topic for the LLM to understand
      const promptTopic = `${actualTopic} (Difficulty: ${difficulty})`;
      
      const response = await interviewApi.quizGenerate({ topic: promptTopic, count: 10 });
      const data = response.data.data;
      if (!data.questions || data.questions.length === 0) {
        throw new Error("The AI failed to generate questions for this topic. Please try a different topic or check your internet connection.");
      }
      setQuiz({ ...data, originalTopic: actualTopic });
      setGameState('playing');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  const correctCount = useMemo(
    () => questions.reduce((acc, item) => (selected[item.id] === item.answer_index ? acc + 1 : acc), 0),
    [selected, questions],
  );

  const triggerDamage = () => {
    setShakeHealth(true);
    setTimeout(() => setShakeHealth(false), 500);
  };

  const useFiftyFifty = () => {
    if (powerups.fiftyFifty <= 0 || !currentQuestion || selected[currentQuestion.id] !== undefined) return;
    
    const wrongIndices = [];
    currentQuestion.options.forEach((_, idx) => {
      if (idx !== currentQuestion.answer_index) wrongIndices.push(idx);
    });
    
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);
    
    setEliminatedOptions(prev => ({ ...prev, [currentQuestion.id]: toEliminate }));
    setPowerups(prev => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
    playSound('powerup');
  };

  const useDoubleScore = () => {
    if (powerups.doubleScore <= 0 || activePowerup) return;
    setActivePowerup('doubleScore');
    setPowerups(prev => ({ ...prev, doubleScore: prev.doubleScore - 1 }));
    playSound('powerup');
  };
  
  const useFreeze = () => {
    if (powerups.freeze <= 0 || activePowerup) return;
    setActivePowerup('freeze');
    setPowerups(prev => ({ ...prev, freeze: prev.freeze - 1 }));
    playSound('powerup');
    setIsTimerPaused(true);
    
    setTimeout(() => {
      setActivePowerup((curr) => curr === 'freeze' ? null : curr);
      setIsTimerPaused(false);
    }, 10000); // 10s freeze
  };

  const onChoose = (optionIndex) => {
    if (selected[currentQuestion.id] !== undefined) return;
    
    if (eliminatedOptions[currentQuestion.id]?.includes(optionIndex)) return;

    const isCorrect = optionIndex === currentQuestion.answer_index;
    setSelected((current) => ({ ...current, [currentQuestion.id]: optionIndex }));
    
    if (isCorrect) {
      playSound('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      let pts = 10;
      if (newStreak >= 3) pts *= 2;
      if (activePowerup === 'doubleScore') {
        pts *= 2;
        setActivePowerup(null);
      }
      setScore(s => s + pts);
    } else {
      playSound('wrong');
      setStreak(0);
      setHealth(h => Math.max(0, h - 1));
      triggerDamage();
      if (activePowerup === 'doubleScore') setActivePowerup(null);
    }

    if (navigator.vibrate) {
      navigator.vibrate(isCorrect ? 50 : [50, 100, 50]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submit();
    }
  };

  const submit = async () => {
    if (!quiz || submitting || gameState === 'result') return;
    setSubmitting(true);
    setIsTimerPaused(true);
    setError('');
    
    try {
      const response = await interviewApi.quizSubmit({
        quiz_id: quiz.quiz_id,
        topic: quiz.topic,
        questions,
        answers: selected,
      });
      setLastResult(response.data.data);
      setGameState('result');
      
      const completionUtterance = new SpeechSynthesisUtterance(
        health <= 0 ? `Game over. You scored ${score} points.` : `Quiz completed. You scored ${score} points.`
      );
      window.speechSynthesis.speak(completionUtterance);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      
      await loadHistory();
    } catch (err) {
      setError(getApiError(err));
      setIsTimerPaused(false);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render Functions ---

  const renderLobby = () => (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
      <section className="space-y-6">
        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-500/10 blur-3xl transition-all group-hover:bg-pink-500/20" />
          <h2 className="text-3xl font-black text-white mb-2 text-glow">Battle Setup</h2>
          <p className="text-slate-400 mb-8">Configure your arena. The higher the difficulty, the tougher the questions.</p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="label mb-3 block">1. Select Domain</label>
              <div className="space-y-2">
                {['Software Engineering', 'Aptitude', 'System Design', 'Data Science', 'Machine Learning', 'Custom'].map(d => (
                  <button 
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${domain === d ? 'bg-cyan-500/20 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/20'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {domain === 'Custom' && (
                <input 
                  autoFocus
                  className="input-field mt-3 !py-3" 
                  placeholder="E.g., Quantum Computing, React Native..." 
                  value={customDomain} 
                  onChange={(e) => setCustomDomain(e.target.value)} 
                />
              )}
            </div>

            <div>
              <label className="label mb-3 block">2. Difficulty Level</label>
              <div className="space-y-2">
                {[
                  { level: 'Easy', icon: '🟢' },
                  { level: 'Medium', icon: '🟡' },
                  { level: 'Hard', icon: '🔴' },
                  { level: 'Expert', icon: '🔥' }
                ].map(diff => (
                  <button 
                    key={diff.level}
                    onClick={() => setDifficulty(diff.level)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${difficulty === diff.level ? 'bg-pink-500/20 border-pink-500 text-pink-100 shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'bg-slate-900/50 border-white/5 text-slate-300 hover:border-white/20'}`}
                  >
                    <span>{diff.level}</span>
                    <span>{diff.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <button 
              className="gradient-button w-full !h-14 !text-lg !rounded-2xl" 
              onClick={startBattle} 
              disabled={loading || (domain === 'Custom' && !customDomain)}
            >
              {loading ? <Spinner label="Summoning Arena..." /> : <><Swords className="h-5 w-5 mr-2" /> Enter Battle</>}
            </button>
          </div>
        </div>
      </section>

      {/* Global Leaderboard Panel */}
      <aside className="space-y-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Global Top 5</h3>
          </div>
          
          <div className="space-y-3">
            {leaderboard.map((player, idx) => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black w-4 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{idx + 1}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-xs border border-cyan-500/30">
                    {player.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{player.name}</p>
                    <p className="text-[10px] text-slate-400">{player.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">{player.score}</p>
                  <p className="text-[10px] text-slate-500">PTS</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">Play matches to climb the leaderboard!</p>
          </div>
        </div>
      </aside>
    </div>
  );

  const renderPlaying = () => {
    if (!quiz || !currentQuestion) return null;
    const isAttempted = selected[currentQuestion.id] !== undefined;
    const currentEliminated = eliminatedOptions[currentQuestion.id] || [];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 slide-in-up">
        {/* Battle Stats Header */}
        <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-20 backdrop-blur-3xl">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
            <div className="flex items-center gap-1 bg-slate-900/50 px-3 py-2 rounded-xl border border-white/5">
              {[1, 2, 3].map(h => (
                <Heart 
                  key={h} 
                  className={`h-5 w-5 transition-all duration-300 ${health >= h ? 'fill-pink-500 text-pink-500 animate-heartbeat' : 'text-slate-700'} ${shakeHealth && health === h - 1 ? 'animate-shake text-pink-500 opacity-50' : ''}`} 
                />
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-black">{score}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${timeLeft <= 60 ? 'bg-pink-500/20 border-pink-500/50 text-pink-400 animate-pulse' : 'bg-slate-900/50 border-white/5 text-cyan-400'}`}>
            <Clock className="h-5 w-5" />
            <span className="text-xl font-black font-mono tracking-wider">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Quit Button */}
            <button 
              className="ghost-button !p-2 !rounded-lg text-pink-400 border-pink-500/30 hover:bg-pink-500/10 mr-2" 
              onClick={() => {
                if (window.confirm("Are you sure you want to quit the exam? Your progress will not be saved.")) {
                  setGameState('lobby');
                }
              }}
              title="Quit Exam"
            >
              <CircleX className="h-5 w-5" />
            </button>
            {/* Power-ups */}
            <button className={`powerup-btn !p-2 !rounded-lg ${activePowerup === 'doubleScore' ? 'powerup-active' : ''}`} onClick={useDoubleScore} disabled={powerups.doubleScore <= 0 || activePowerup}>
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-[9px] absolute -top-1 -right-1 bg-slate-800 rounded-full h-4 w-4 flex items-center justify-center border border-white/20">{powerups.doubleScore}</span>
            </button>
            <button className={`powerup-btn !p-2 !rounded-lg ${activePowerup === 'freeze' ? 'powerup-active' : ''}`} onClick={useFreeze} disabled={powerups.freeze <= 0 || activePowerup}>
              <Snowflake className="h-5 w-5 text-cyan-400" />
              <span className="text-[9px] absolute -top-1 -right-1 bg-slate-800 rounded-full h-4 w-4 flex items-center justify-center border border-white/20">{powerups.freeze}</span>
            </button>
            <button className="powerup-btn !p-2 !rounded-lg" onClick={useFiftyFifty} disabled={powerups.fiftyFifty <= 0 || isAttempted || currentEliminated.length > 0}>
              <Zap className="h-5 w-5 text-violet-400" />
              <span className="text-[9px] absolute -top-1 -right-1 bg-slate-800 rounded-full h-4 w-4 flex items-center justify-center border border-white/20">{powerups.fiftyFifty}</span>
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div 
          className={`glass-panel p-6 sm:p-10 transition-all duration-500 relative overflow-hidden ${activePowerup === 'freeze' ? 'hue-rotate-15 blur-[0.5px] sepia-[0.2]' : ''}`}
          onCopy={(e) => { e.preventDefault(); setNotice("Copying is disabled during battle!"); }}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: 'none' }}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }} />
          </div>
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="label flex items-center gap-2 text-cyan-400">
                Question {currentQuestionIndex + 1} of {questions.length}
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{quiz.originalTopic} ({difficulty})</span>
              </p>
              <h2 className="mt-4 text-2xl font-bold leading-relaxed text-white">{currentQuestion.question}</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, optionIndex) => {
              const isEliminated = currentEliminated.includes(optionIndex);
              const isPicked = selected[currentQuestion.id] === optionIndex;
              const isCorrectAnswer = isAttempted && optionIndex === currentQuestion.answer_index;
              const isWrongPick = isAttempted && isPicked && optionIndex !== currentQuestion.answer_index;
              
              return (
                <button
                  key={optionIndex}
                  type="button"
                  disabled={isAttempted || isEliminated}
                  onClick={() => onChoose(optionIndex)}
                  className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-300 
                    ${isEliminated ? 'opacity-20 scale-95 grayscale' : ''}
                    ${isPicked ? 'scale-[0.98]' : ''} 
                    ${isCorrectAnswer ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''} 
                    ${isWrongPick ? 'bg-pink-500/10 border-pink-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : ''}
                    ${!isAttempted && !isEliminated ? 'bg-slate-900/50 border-white/5 hover:border-cyan-500/50 hover:bg-slate-800' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className={`flex-shrink-0 inline-grid h-8 w-8 place-items-center rounded-lg text-sm font-black transition-colors 
                      ${isCorrectAnswer ? 'bg-emerald-500 text-white' : isWrongPick ? 'bg-pink-500 text-white' : 'bg-white/10 text-slate-300'}`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className={`text-base sm:text-lg ${isCorrectAnswer ? 'text-emerald-100 font-bold' : isWrongPick ? 'text-pink-100 font-bold' : 'text-slate-200'}`}>
                      {option}
                    </span>
                  </div>
                  
                  {isCorrectAnswer && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-400" />}
                  {isWrongPick && <CircleX className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-pink-400" />}
                </button>
              );
            })}
          </div>

          {/* Action Area */}
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex items-center gap-3">
              {streak >= 3 && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg animate-pulse">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-bold text-orange-400">{streak} Streak! (2x Pts)</span>
                </div>
              )}
            </div>
            
            {isAttempted && (
              <button 
                className="gradient-button !rounded-xl slide-in-right" 
                onClick={handleNext}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Battle'}
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const pieData = [
      { name: 'Correct', value: correctCount, color: '#34d399' },
      { name: 'Wrong', value: questions.length - correctCount, color: '#fb7185' },
    ];
    
    return (
      <div className="max-w-5xl mx-auto space-y-6 slide-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-cyan-500/20 border border-cyan-500/50 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            <Trophy className="h-10 w-10 text-cyan-400" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">Battle Concluded</h1>
          <p className="text-xl text-slate-400">{health > 0 ? 'You survived the arena!' : 'You were defeated.'}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel p-6 text-center border-yellow-500/30">
            <Star className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-4xl font-black text-white">{score}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Total Score</p>
          </div>
          <div className="glass-panel p-6 text-center border-emerald-500/30">
            <Target className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-4xl font-black text-white">{Math.round((correctCount/questions.length)*100)}%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Accuracy</p>
          </div>
          <div className="glass-panel p-6 text-center border-cyan-500/30">
            <BrainCircuit className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
            <p className="text-4xl font-black text-white">{lastResult?.ai_avg_score ?? 0}%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">AI Peer Avg</p>
          </div>
          <div className="glass-panel p-6 text-center border-pink-500/30">
            <Heart className="h-8 w-8 text-pink-400 mx-auto mb-3" />
            <p className="text-4xl font-black text-white">{health}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Remaining HP</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <article className="glass-panel p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-6">Hit Ratio</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} animationDuration={900}>
                    {pieData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none translate-y-4">
                <span className="text-2xl font-black text-white">{correctCount}/{questions.length}</span>
              </div>
            </div>
          </article>
          
          <article className="glass-panel p-6 flex flex-col justify-center items-center text-center">
            <Shield className="h-16 w-16 text-cyan-400 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Ready for more?</h3>
            <p className="text-slate-400 mb-8 max-w-sm">Every battle sharpens your skills. Check the leaderboard on the dashboard or jump right back into the arena.</p>
            <div className="flex gap-4">
              <button className="ghost-button border-cyan-500/50 hover:bg-cyan-500/10" onClick={() => navigate('/dashboard')}>
                View Dashboard
              </button>
              <button className="gradient-button" onClick={() => setGameState('lobby')}>
                Play Again
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  };

  return (
    <main className="page-shell">
      {error && gameState !== 'playing' ? <p className="mb-4 border border-pink-300/20 bg-pink-300/10 p-3 text-sm text-pink-100 rounded-xl">{error}</p> : null}
      
      {gameState === 'lobby' && renderLobby()}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'result' && renderResult()}
      
      {/* Anti-Cheat Warning Modal */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md slide-in-up px-4">
          <div className="glass-panel border-pink-500/80 p-8 text-center max-w-md w-full shadow-[0_0_50px_rgba(236,72,153,0.4)]">
            <div className="mx-auto w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl font-black">!</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 text-glow">Tab Switch Detected!</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Leaving the arena is strictly prohibited. This is your warning <strong>{warnings} of {MAX_WARNINGS}</strong>. 
              If you leave again, your battle will be immediately forfeited.
            </p>
            <button className="gradient-button w-full !h-12 !text-lg !rounded-xl border-pink-500 hover:shadow-pink-500/50" onClick={dismissCheatWarning}>
              I Understand, Return to Battle
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
