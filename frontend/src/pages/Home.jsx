import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Layers3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
  Users,
  LineChart,
  Star,
  Quote,
  ChevronRight,
  Code2,
  Terminal,
  Cpu,
  Globe,
  Database,
  Layout,
  Smartphone,
  IndianRupee,
  Github,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, getApiError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const skills = [
  { name: 'React.js', Icon: Code2, color: 'text-cyan-400' },
  { name: 'Node.js', Icon: Terminal, color: 'text-emerald-400' },
  { name: 'Python', Icon: Database, color: 'text-blue-500' },
  { name: 'System Design', Icon: Cpu, color: 'text-violet-400' },
  { name: 'AWS Cloud', Icon: Globe, color: 'text-orange-400' },
  { name: 'UI/UX Design', Icon: Layout, color: 'text-pink-400' },
  { name: 'Mobile Dev', Icon: Smartphone, color: 'text-rose-400' },
  { name: 'SQL/NoSQL', Icon: Database, color: 'text-indigo-400' },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [sent, setSent] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleFeedback = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      rating: rating,
      comment: formData.get('comment')
    };
    
    try {
      await userApi.submitFeedback(payload);
      setFeedbackSent(true);
      e.currentTarget.reset();
      setRating(5);
      setTimeout(() => setFeedbackSent(false), 5000);
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <main className="relative z-10 scroll-smooth bg-night overflow-hidden">
      {/* Global Seamless Dynamic Canvas Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-violet-500/10 blur-[150px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-pink-500/5 blur-[150px] animate-pulse delay-500" />
      </div>
      <div className="fixed inset-0 bg-grid-white bg-[center_top_-1px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] pointer-events-none z-0 opacity-40" />

      {/* Hero Section */}
      <section id="home" className="relative min-h-[95vh] flex items-center pt-20">
        <div className="page-shell relative grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start space-y-10 slide-in-left">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-cyan-400 backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              <span>Next-Gen Interview Preparation</span>
            </div>
            
            <h1 className="text-6xl sm:text-8xl font-black leading-[0.9] tracking-tighter text-white">
              Forge Your <br />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 bg-clip-text text-transparent">Career Path</span>
            </h1>
            
            <p className="max-w-xl text-xl text-slate-400 leading-relaxed font-medium">
              TalentForge blends cutting-edge AI with deep industry insights to help you master technical interviews, refine your skills, and land your dream role.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="gradient-button !h-16 !px-10 !text-lg group">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/quiz" className="ghost-button !h-16 !px-10 !text-lg">
                    Take Quiz
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="gradient-button !h-16 !px-10 !text-lg group">
                    Get Started Now
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/login" className="ghost-button !h-16 !px-10 !text-lg">
                    Explore Demo
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-night bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-500">
                <span className="text-white">10k+</span> engineers already joined
              </p>
            </div>
          </div>

          <div className="relative slide-in-right hidden lg:block">
            <div className="relative z-10 floating">
              <div className="glass-panel p-2 border-white/10 bg-white/[0.02] shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                <div className="rounded-[22px] bg-slate-950/50 p-8 backdrop-blur-3xl overflow-hidden relative">
                   {/* Logo in Hero */}
                   <div className="flex flex-col items-center justify-center py-12 space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 scale-150" />
                        <div className="relative h-32 w-32 flex items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-cyan-500 via-violet-600 to-pink-500 p-1">
                          <div className="h-full w-full rounded-[2.3rem] bg-slate-950 flex items-center justify-center">
                            <BrainCircuit className="h-16 w-16 text-cyan-400" />
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-4xl font-black text-white tracking-tighter">TalentForge</h2>
                        <p className="text-cyan-400 font-black tracking-[0.3em] uppercase text-xs mt-2">AI Mastery Engine</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="glass-soft p-4 border-white/5 bg-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Analysis Precision</p>
                        <p className="text-2xl font-black text-white mt-1">99.2%</p>
                      </div>
                      <div className="glass-soft p-4 border-white/5 bg-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Response Time</p>
                        <p className="text-2xl font-black text-white mt-1">1.2s</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Marquee */}
      <section className="py-20 relative z-10">
        <div className="page-shell">
           <p className="text-center text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-12">Elevate your expertise in</p>
           <div className="marquee-row skill-scroller">
              <div className="marquee-track flex gap-8 items-center">
                {[...skills, ...skills].map((skill, i) => (
                  <div key={i} className="flex items-center gap-4 px-8 py-5 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm group hover:border-cyan-500/30 transition-all cursor-default min-w-[220px]">
                    <skill.Icon className={`h-6 w-6 ${skill.color}`} />
                    <span className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors">{skill.name}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </section>

      {/* Interactive Features */}
      <section id="features" className="py-32 relative z-10">
        <div className="page-shell">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-cyan-400 font-black tracking-widest uppercase text-sm">Engine Capabilities</h2>
            <p className="text-4xl sm:text-6xl font-black text-white tracking-tight">The ultimate toolkit for <span className="text-slate-600">modern builders.</span></p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'AI Roleplay', desc: 'Simulate high-stakes interviews with adaptive AI that learns your weaknesses.', icon: Users, color: 'cyan' },
              { title: 'Resume Pulse', desc: 'Instantly transform your PDF into a personalized prep engine with target analysis.', icon: FileText, color: 'violet' },
              { title: 'Deep Analytics', desc: 'Track your growth with interactive charts and granular performance metrics.', icon: BarChart3, color: 'pink' },
            ].map((f, i) => (
              <div key={i} className="glass-panel p-10 group hover:-translate-y-2 transition-all duration-500">
                <div className={`h-16 w-16 rounded-2xl bg-${f.color}-500/10 flex items-center justify-center text-${f.color}-400 mb-8 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                <Link to="/blog" className="mt-8 flex items-center gap-2 text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Learn more <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cinematic About Section - Seamlessly Blended */}
      <section id="about" className="py-32 relative z-10 overflow-hidden">
        {/* Soft edge mask image to blend the cinematic background into the page seamlessly */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-luminosity grayscale [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] pointer-events-none" />
        
        <div className="page-shell relative flex flex-col items-center text-center slide-in-up">
          <BrainCircuit className="h-20 w-20 text-cyan-500 mb-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-8 max-w-4xl leading-[1.1]">
            Built by engineers, <br/>
            <span className="text-slate-500">for the next generation of builders.</span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-300 font-medium max-w-4xl leading-relaxed opacity-90">
            TalentForge democratizes high-end interview coaching. We replace static question banks with dynamic, adaptive AI simulations. Practice real-world scenarios, get instant granular feedback, and forge your career with absolute precision.
          </p>
        </div>
      </section>

      {/* Modern Contact Section - Floating Glass Layout */}
      <section id="contact" className="py-24 relative z-10">
        <div className="page-shell max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="slide-in-left">
              <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Questions? <br/>Let's Connect.</h2>
              <p className="text-slate-400 text-xl mb-12 font-medium leading-relaxed">Our support team is available 24/7 to help you optimize your experience and resolve any issues.</p>
              
              <div className="space-y-10">
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 backdrop-blur-sm transition-all">
                    <Mail className="h-7 w-7 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-1">Email Us</h4>
                    <p className="text-slate-400 text-lg">support@talentforge.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:border-violet-500/50 group-hover:bg-violet-500/10 backdrop-blur-sm transition-all">
                    <Phone className="h-7 w-7 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-1">Call Us</h4>
                    <p className="text-slate-400 text-lg">+91 7020366433</p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:border-pink-500/50 group-hover:bg-pink-500/10 backdrop-blur-sm transition-all">
                    <MapPin className="h-7 w-7 text-pink-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl mb-1">Headquarters</h4>
                    <p className="text-slate-400 text-lg">Bengaluru, India</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-10 shadow-2xl rounded-[2rem] slide-in-right">
              <h3 className="text-2xl font-bold text-white mb-8">Send a Message</h3>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent to TalentForge Support!'); e.target.reset(); }}>
                <div>
                  <input type="text" placeholder="Your Name" className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-500" required />
                </div>
                <div>
                  <input type="email" placeholder="Email Address" className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all placeholder:text-slate-500" required />
                </div>
                <div>
                  <textarea placeholder="How can we help?" rows="5" className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-5 py-4 text-white text-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all resize-none placeholder:text-slate-500" required></textarea>
                </div>
                <button type="submit" className="w-full bg-white text-black font-black text-lg py-5 rounded-xl hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg">
                  <Send className="h-5 w-5" /> Transmit Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Blended beautifully into the flow */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="page-shell">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-pink-500 font-black tracking-widest uppercase text-sm">Choose Your Plan</h2>
            <p className="text-4xl sm:text-6xl font-black text-white tracking-tight">Unlock the ultimate <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">Interview Arsenal.</span></p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            {/* Free Tier */}
            <article className="glass-panel p-10 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 flex flex-col h-full rounded-[2rem] slide-in-up">
              <div className="mb-8">
                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest border border-white/10 mb-6">Basic</span>
                <h3 className="text-3xl font-black text-white mb-2">Free Core</h3>
                <p className="text-slate-400 font-medium">Start practicing your skills today with essential tools.</p>
              </div>
              <div className="mb-8">
                <span className="text-6xl font-black text-white"><IndianRupee className="inline h-10 w-10 mb-2"/>0</span>
                <span className="text-slate-500 font-bold"> / forever</span>
              </div>
              <div className="space-y-5 flex-1 mb-10">
                {['2 interviews per day', 'Basic question bank', 'Keyword feedback', 'Dashboard stats'].map((feature, i) => (
                  <p key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-slate-500" />
                    {feature}
                  </p>
                ))}
              </div>
              <Link className="ghost-button w-full !h-14 !text-lg !rounded-xl" to={isAuthenticated ? '/dashboard' : '/register'}>
                Continue Free
              </Link>
            </article>

            {/* Premium Tier */}
            <article className="relative glass-panel p-10 border-pink-500/30 bg-gradient-to-b from-pink-500/10 to-violet-900/20 hover:from-pink-500/20 transition-all duration-500 flex flex-col h-full lg:h-[105%] rounded-[2rem] shadow-[0_0_50px_rgba(236,72,153,0.15)] z-10 scale-100 lg:scale-105 slide-in-up" style={{animationDelay: '100ms'}}>
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-50" />
              <div className="mb-8 relative">
                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-500/25 mb-6">Most Popular</span>
                <Crown className="absolute top-0 right-0 h-12 w-12 text-pink-400/20 animate-pulse" />
                <h3 className="text-3xl font-black text-white mb-2">Premium</h3>
                <p className="text-pink-200/70 font-medium">For serious candidates aiming for top-tier tech roles.</p>
              </div>
              <div className="mb-8">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400"><IndianRupee className="inline h-10 w-10 text-pink-400 mb-2"/>749</span>
                <span className="text-slate-400 font-bold"> / month</span>
              </div>
              <div className="space-y-5 flex-1 mb-10">
                {['Unlimited interviews & Battles', 'Advanced AI-style prompts', 'Resume-based interview questions', 'Detailed analytics & ATS Scoring'].map((feature, i) => (
                  <p key={i} className="flex items-center gap-3 text-white font-medium">
                    <CheckCircle2 className="h-5 w-5 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                    {feature}
                  </p>
                ))}
              </div>
              {isAuthenticated && user?.plan_type !== 'premium' ? (
                <Link className="gradient-button w-full !h-14 !text-lg !rounded-xl !from-pink-600 !via-purple-600 !to-violet-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]" to="/payment">
                  Upgrade to Premium
                </Link>
              ) : !isAuthenticated ? (
                <Link className="gradient-button w-full !h-14 !text-lg !rounded-xl !from-pink-600 !via-purple-600 !to-violet-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]" to="/register">
                  Get Premium Now
                </Link>
              ) : (
                <button className="ghost-button w-full !h-14 !text-lg !rounded-xl border-pink-500/50 text-pink-400 bg-pink-500/10 cursor-default" type="button" disabled>
                  Premium Active
                </button>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section id="feedback" className="py-32 relative z-10">
        <div className="page-shell">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Quote className="h-8 w-8" />
                </div>
                <h2 className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tighter">Voice of Our <br /> <span className="text-amber-400">Community.</span></h2>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">Your insights fuel our evolution. Help us build the future of career forge technology.</p>
              </div>
              
              <div className="space-y-6">
                {[
                  { name: 'Sarah L.', role: 'Frontend Lead', text: 'The AI feedback was surprisingly precise. It caught my habit of over-explaining state management.' },
                  { name: 'David K.', role: 'Senior Engineer', text: 'A must-have tool for any serious dev. The system design simulations are unmatched.' }
                ].map((t, i) => (
                  <div key={i} className="glass-panel p-8 border-white/5 bg-white/[0.01]">
                    <p className="text-slate-300 italic text-lg leading-relaxed">"{t.text}"</p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{t.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-[3rem] blur opacity-20" />
              <div className="relative glass-panel p-10 bg-slate-900/40 backdrop-blur-3xl">
                <h3 className="text-3xl font-bold text-white mb-2">Help Us Grow</h3>
                <p className="text-slate-400 mb-10 font-medium">Contribute to the TalentForge roadmap.</p>
                
                <form className="space-y-8" onSubmit={handleFeedback}>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Platform Rating</p>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setRating(s)} className={`transition-all hover:scale-125 ${rating >= s ? 'text-amber-400' : 'text-slate-700'}`}>
                          <Star className={`h-10 w-10 ${rating >= s ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <input name="name" className="input-field !h-14 bg-white/5" placeholder="Your Name" required />
                    <input name="email" type="email" className="input-field !h-14 bg-white/5" placeholder="Email (optional)" />
                  </div>

                  <textarea name="comment" className="input-field !h-40 bg-white/5 pt-5" placeholder="Tell us how we can improve..." required />

                  {feedbackSent && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-400 animate-in zoom-in-95">
                      <CheckCircle2 className="h-6 w-6" />
                      <p className="font-bold">Intelligence received! Thank you.</p>
                    </div>
                  )}

                  <button disabled={feedbackLoading} className="gradient-button !h-16 w-full text-lg shadow-2xl shadow-cyan-500/20 group" type="submit">
                    {feedbackLoading ? 'Processing...' : 'Transmit Feedback'}
                    {!feedbackLoading && <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mega Footer - Professional SaaS Style */}
      <footer className="pt-24 pb-12 relative z-10 border-t border-white/5 bg-slate-950/40 backdrop-blur-3xl overflow-hidden mt-20">
        {/* Cinematic Top Glow Edge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="page-shell relative z-10 !pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">
            
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-2 slide-in-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-[1px] shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                   <div className="h-full w-full rounded-[15px] bg-slate-950 flex items-center justify-center text-cyan-400">
                      <BrainCircuit className="h-6 w-6" />
                   </div>
                </div>
                <span className="text-3xl font-black text-white tracking-tighter">TalentForge</span>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm mb-8">
                Democratizing high-end interview coaching. Master your technical skills with our adaptive AI simulator.
              </p>
              <div className="flex gap-4">
                {[
                  { Icon: Twitter, name: 'Twitter', url: '#' },
                  { Icon: Github, name: 'Github', url: 'https://github.com/Sujit451718' },
                  { Icon: Linkedin, name: 'LinkedIn', url: 'https://www.linkedin.com/in/sujit-rukade-80457a323/' },
                  { Icon: Instagram, name: 'Instagram', url: 'https://www.instagram.com/rukadesujit45?igsh=MTRjOHBvNHNtdmVseg==' }
                ].map((social, i) => (
                   <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="h-11 w-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/50 hover:scale-110 transition-all shadow-lg">
                     <span className="sr-only">{social.name}</span>
                     <social.Icon className="h-5 w-5" />
                   </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="slide-in-up" style={{animationDelay: '100ms'}}>
              <h4 className="text-white font-bold mb-6 text-lg">Product</h4>
              <ul className="space-y-4">
                {['AI Simulator', 'Resume Pulse', 'Deep Analytics', 'Pricing', 'Battle Mode'].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-cyan-400 font-medium transition-colors inline-flex items-center gap-2 group">
                      <span className="h-1 w-1 rounded-full bg-cyan-500/0 group-hover:bg-cyan-500 transition-all" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="slide-in-up" style={{animationDelay: '200ms'}}>
              <h4 className="text-white font-bold mb-6 text-lg">Resources</h4>
              <ul className="space-y-4">
                {['Interview Prep Guide', 'System Design', 'Blog', 'Community', 'Help Center'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-cyan-400 font-medium transition-colors inline-flex items-center gap-2 group">
                      <span className="h-1 w-1 rounded-full bg-violet-500/0 group-hover:bg-violet-500 transition-all" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1 slide-in-up" style={{animationDelay: '300ms'}}>
              <h4 className="text-white font-bold mb-6 text-lg">Company</h4>
              <ul className="space-y-4">
                {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-cyan-400 font-medium transition-colors inline-flex items-center gap-2 group">
                      <span className="h-1 w-1 rounded-full bg-pink-500/0 group-hover:bg-pink-500 transition-all" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-slate-500">© 2026 TalentForge Labs Inc. All rights reserved.</p>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/50 border border-white/10 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-slate-300">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );

}
