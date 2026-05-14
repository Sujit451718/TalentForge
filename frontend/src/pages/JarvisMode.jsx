import { AlertTriangle, BrainCircuit, Mic, MicOff, Shield, StopCircle, Video, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { getApiError, interviewApi } from '../services/api.js';

export default function JarvisMode() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // States
  const [gameState, setGameState] = useState('setup'); // 'setup' | 'permission' | 'active'
  const [stream, setStream] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  // Recognition & Synthesis
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // Meta
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [jarvisLine, setJarvisLine] = useState('');
  
  // Setup
  const [role, setRole] = useState('Software Engineer');
  const [level, setLevel] = useState('Mid');
  
  // Anti-cheat
  const [cheatWarning, setCheatWarning] = useState(false);

  const speechSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!speechSupported) return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    return () => {
      try { recognition.stop(); } catch (err) {}
      recognitionRef.current = null;
    };
  }, [speechSupported]);

  // Effect to handle video stream mapping
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) recognitionRef.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [stream]);

  // Anti-Cheat: Tab switching
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && gameState === 'active' && !cheatWarning) {
        setCheatWarning(true);
        terminateInterview("Interview failed. Tab switching detected.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [gameState, cheatWarning]);

  // Request Permissions & Start
  const requestPermissionsAndStart = async () => {
    // Unlock Speech Synthesis immediately on user click to bypass autoplay restrictions
    if (window.speechSynthesis) {
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }

    setLoading(true);
    setError('');
    try {
      // 1. Check permissions first
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // 2. Try to start interview in backend
      try {
        const response = await interviewApi.start({ role, experience_level: level, use_resume: false });
        const data = response.data.data;
        
        setStream(mediaStream);
        setGameState('active');
        setSession(data);
        
        // Start the conversation
        const firstQuestion = data.questions?.[0]?.question || 'To start, please introduce yourself and connect your background to this role.';
        setTimeout(() => {
          jarvisSpeak(
            `Hello. I am Jarvis, your AI interviewer for this ${role} round. We will begin like a real MNC interview: first, your self introduction.`,
            () => askQuestion(firstQuestion)
          );
        }, 1000);
      } catch (apiErr) {
        // Stop the stream if backend fails
        mediaStream.getTracks().forEach(t => t.stop());
        setError(getApiError(apiErr));
        setGameState('setup');
      }
    } catch (err) {
      setError("Camera & Microphone permissions are strictly required for Jarvis Mode.");
      setGameState('setup');
    } finally {
      setLoading(false);
    }
  };

  const jarvisSpeak = (text, onEndCallback) => {
    setJarvisLine(text);
    if (!window.speechSynthesis) {
      if (onEndCallback) onEndCallback();
      return;
    }
    
    // Crucial: cancel any stuck or pending speech
    window.speechSynthesis.cancel();
    
    setIsJarvisSpeaking(true);
    setIsUserSpeaking(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Fallback to default if no voices are loaded yet
    if (voices.length > 0) {
      const voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('David')) || voices[0];
      if (voice) utterance.voice = voice;
    }
    
    utterance.pitch = 0.95;
    utterance.rate = 1.05;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setIsJarvisSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    window.speechSynthesis.speak(utterance);
  };

  const askQuestion = (qText) => {
    setCurrentPrompt(qText);
    jarvisSpeak(qText, () => {
      startListeningForAnswer();
    });
  };

  const startListeningForAnswer = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setIsUserSpeaking(true);
    setTranscript('');
    setInterimTranscript('');
    
    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }
      if (finalStr) setTranscript(prev => prev + ' ' + finalStr);
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // restart listening if they are just quiet
        try { recognition.start(); } catch (e) {}
      }
    };

    try {
      recognition.start();
    } catch (e) {}
  };

  const finishAnswering = async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsUserSpeaking(false);
    
    const finalAnswer = (transcript + ' ' + interimTranscript).trim();
    const currentQuestion = session.questions[currentQIndex];
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: finalAnswer || 'No audible answer provided.' }));
    setEvaluating(true);
    
    try {
      // Real-time evaluation
      const payload = {
        interview_id: session.interview_id,
        answers: [{
          question_id: currentQuestion.id,
          answer: finalAnswer || 'No audible answer provided.'
        }]
      };
      const response = await interviewApi.submit(payload);
      const evaluatedQ = response.data.data.questions.find(q => q.id === currentQuestion.id);
      
      setLastFeedback(evaluatedQ);
      
      // Construct Jarvis feedback speech
      let feedbackSpeech = evaluatedQ?.jarvis_response;
      if (!feedbackSpeech) {
        feedbackSpeech = "Thank you.";
        if (evaluatedQ && evaluatedQ.strengths && evaluatedQ.strengths.length > 0) {
          feedbackSpeech += ` One of your strengths is ${evaluatedQ.strengths[0]}.`;
        }
        if (evaluatedQ && evaluatedQ.weaknesses && evaluatedQ.weaknesses.length > 0) {
          feedbackSpeech += ` An area to improve is ${evaluatedQ.weaknesses[0]}.`;
        }
      }
      if (evaluatedQ?.follow_up_question) {
        feedbackSpeech += ` A real panel may follow up with: ${evaluatedQ.follow_up_question}`;
      }
      
      setEvaluating(false);
      
      if (currentQIndex < session.questions.length - 1) {
        const nextIndex = currentQIndex + 1;
        setCurrentQIndex(nextIndex);
        setTranscript('');
        setInterimTranscript('');
        jarvisSpeak(`${feedbackSpeech} Now for the next question: `, () => askQuestion(session.questions[nextIndex].question));
      } else {
        jarvisSpeak(`${feedbackSpeech} That concludes the interview. I am compiling your final profile now.`, () => {
          submitInterview();
        });
      }
    } catch (err) {
      setEvaluating(false);
      setError("Failed to evaluate answer.");
    }
  };

  const submitInterview = async () => {
    setLoading(true);
    try {
      // Stop streams
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      
      // Since we evaluate real-time, the backend already marks it completed on the final answer submission.
      // Just navigate to the feedback page!
      navigate(`/feedback/${session.interview_id}`);
    } catch (err) {
      setError("Failed to generate feedback.");
    } finally {
      setLoading(false);
    }
  };

  const terminateInterview = (reason) => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    if (stream) stream.getTracks().forEach(t => t.stop());
    setNotice(reason);
    setGameState('setup');
  };

  const renderSetup = () => (
    <div className="max-w-2xl mx-auto glass-panel p-10 text-center slide-in-up">
      <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
        <BrainCircuit className="h-12 w-12 text-cyan-400" />
      </div>
      <h1 className="text-4xl font-black text-white mb-4 text-glow">Jarvis Mode</h1>
      <p className="text-lg text-slate-400 mb-8">
        Face-to-face AI voice interview. Your camera and microphone are required. 
        Anti-cheat is strictly enforced. No tab switching allowed.
      </p>
      
      {!speechSupported && (
        <div className="bg-pink-500/10 border border-pink-500/20 text-pink-400 p-4 rounded-xl mb-6 text-sm">
          Your browser does not support the Web Speech API. Please use Google Chrome for Jarvis Mode.
        </div>
      )}
      
      <div className="text-left mb-8 max-w-md mx-auto grid grid-cols-2 gap-4">
        <div>
          <label className="label block mb-2 text-center">Interview Role</label>
          <select className="input-field !text-center" value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Software Engineer</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>Full Stack Developer</option>
            <option>Data Scientist</option>
            <option>Machine Learning Engineer</option>
          </select>
        </div>
        <div>
          <label className="label block mb-2 text-center">Experience Level</label>
          <select className="input-field !text-center" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option>Junior</option>
            <option>Mid</option>
            <option>Senior</option>
          </select>
        </div>
      </div>

      <button 
        className="gradient-button w-full !h-16 !text-xl !rounded-2xl shadow-cyan-500/20"
        onClick={requestPermissionsAndStart}
        disabled={loading || !speechSupported}
      >
        {loading ? <Spinner label="Initializing Jarvis..." /> : <><Video className="h-6 w-6 mr-2" /> Start Live Interview</>}
      </button>
      
      {error && <p className="mt-6 text-pink-400 text-sm font-medium">{error}</p>}
      {notice && <p className="mt-6 text-orange-400 text-sm font-medium border border-orange-500/20 bg-orange-500/10 p-4 rounded-xl">{notice}</p>}
    </div>
  );

  const renderActive = () => (
    <div className="max-w-6xl mx-auto relative min-h-[80vh] flex flex-col justify-between slide-in-up">
      {/* Top Bar */}
      <div className="glass-panel p-4 flex items-center justify-between mb-6 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest animate-pulse">
            <Video className="h-4 w-4" /> Live Recording
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest">
            <Shield className="h-4 w-4" /> Anti-Cheat Active
          </div>
        </div>
        <button className="ghost-button !h-10 text-pink-400 hover:bg-pink-500/10 border border-pink-500/20" onClick={() => terminateInterview("Interview aborted by user.")}>
          <StopCircle className="h-4 w-4 mr-2" /> Abort
        </button>
      </div>

      {/* Main Stage - Google Meet Style Split Screen */}
      <div className="flex-1 grid md:grid-cols-2 gap-4">
        {/* User Camera Panel */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-900 flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium text-white flex items-center gap-2">
             You {isUserSpeaking && <Mic className="h-3 w-3 text-emerald-400 animate-pulse" />}
          </div>
        </div>

        {/* Jarvis Panel */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-slate-900" />
          <div className={`relative z-10 transition-all duration-700 flex flex-col items-center ${isJarvisSpeaking ? 'scale-110' : 'scale-90 opacity-80'}`}>
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_80px_rgba(34,211,238,0.4)] ${isJarvisSpeaking ? 'bg-cyan-400/20 border-4 border-cyan-400 animate-pulse' : 'bg-slate-800 border-4 border-slate-600'}`}>
              <BrainCircuit className={`h-16 w-16 ${isJarvisSpeaking ? 'text-cyan-300' : 'text-slate-500'}`} />
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center max-w-sm mx-auto px-4 py-2 glass-panel border-cyan-500/30">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Volume2 className="h-3 w-3" /> {isJarvisSpeaking ? 'Jarvis is speaking' : 'Jarvis is listening'}
              </p>
              <p className="text-sm font-medium text-slate-300 mt-1 italic">
                "Listen to Jarvis carefully..."
              </p>
            </div>
          </div>
          <div className="absolute left-4 right-4 top-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <p className="label mb-2 text-cyan-300">Current Interview Prompt</p>
            <p className="text-sm font-semibold leading-relaxed text-white">
              {currentPrompt || 'Jarvis is preparing your first question...'}
            </p>
            {jarvisLine && (
              <p className="mt-3 line-clamp-2 text-xs font-medium italic text-slate-400">
                {jarvisLine}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Evaluation / User Interaction Area */}
      <div className="mt-6 z-10 relative grid lg:grid-cols-3 gap-4">
        {/* Real-time feedback panel */}
        <div className="lg:col-span-1 glass-panel p-6 border border-white/5 flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Live AI Analysis</h3>
          {evaluating ? (
             <div className="flex items-center gap-2 text-cyan-400 text-sm">
                <Spinner label="Evaluating..." />
             </div>
          ) : lastFeedback ? (
            <div className="space-y-3">
               <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase">Strength</p>
                  <p className="text-xs text-slate-300 line-clamp-2">{lastFeedback.strengths?.[0] || 'Good effort.'}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-pink-400 uppercase">Weakness</p>
                  <p className="text-xs text-slate-300 line-clamp-2">{lastFeedback.weaknesses?.[0] || 'Keep practicing.'}</p>
               </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Waiting for your first answer...</p>
          )}
        </div>
        
        {/* Answer Box */}
        <div className={`lg:col-span-2 glass-panel p-6 border transition-all duration-300 ${isUserSpeaking ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-white/5 opacity-50'}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${isUserSpeaking ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
               {isUserSpeaking ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your Answer Transcript</p>
              <p className="text-lg text-white font-medium min-h-16">
                {transcript}
                <span className="text-emerald-400 opacity-70">{interimTranscript}</span>
                {!transcript && !interimTranscript && isUserSpeaking && <span className="text-slate-500 italic">Listening...</span>}
                {!isUserSpeaking && !transcript && <span className="text-slate-600 italic">Waiting for Jarvis...</span>}
              </p>
            </div>
            
            {isUserSpeaking && (
              <button className="gradient-button shrink-0 !h-12 px-6" onClick={finishAnswering}>
                Done Answering
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Cheat Modal overlay */}
      {cheatWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
          <div className="glass-panel border-pink-500/80 p-10 text-center max-w-md shadow-[0_0_50px_rgba(236,72,153,0.4)]">
            <AlertTriangle className="h-16 w-16 text-pink-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-4">Interview Terminated</h2>
            <p className="text-slate-300">Tab switching is prohibited in Jarvis Mode. The session has been aborted and flagged.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <main className="page-shell">
      {gameState === 'setup' ? renderSetup() : renderActive()}
    </main>
  );
}

