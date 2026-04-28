import { 
  BarChart3, 
  BrainCircuit, 
  CreditCard, 
  Crown, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  Moon, 
  Sparkles, 
  Sun, 
  UserCircle2, 
  X,
  Plus,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  const publicLinks = [
    { to: '/', label: 'Home', hash: '#home' },
    { to: '/', label: 'About Us', hash: '#about' },
    { to: '/', label: 'Contact', hash: '#contact' },
    { to: '/', label: 'Pricing', hash: '#pricing' },
  ];

  const dashboardLinks = [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/ats-score', label: 'ATS Score', Icon: FileText },
    { to: '/interview', label: 'Interview', Icon: BrainCircuit },
    { to: '/quiz', label: 'Battle', Icon: Sparkles },
    { to: '/feedback', label: 'Feedback', Icon: BarChart3 },
    { to: '/profile', label: 'Profile', Icon: UserCircle2 },
  ];

  if (user?.role === 'admin') {
    dashboardLinks.unshift({ to: '/admin-dashboard', label: 'Admin', Icon: ShieldCheck });
  }

  const scrollToSection = (to, hash) => {
    setOpen(false);
    if (location.pathname === to) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(to + hash);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
      <header 
        className={`mx-auto max-w-7xl transition-all duration-500 border border-white/10 ${
          scrolled 
            ? 'rounded-3xl bg-slate-950/80 shadow-[0_8px_30px_rgb(0,0,0,0.12),0_0_20px_rgba(34,211,238,0.1)] backdrop-blur-2xl' 
            : 'rounded-none border-transparent bg-transparent'
        }`}
        style={scrolled ? { backgroundColor: 'var(--glass-bg)' } : {}}
      >
        <nav className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3 transition-all duration-300 hover:scale-105">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-950 transition-colors group-hover:bg-slate-900">
                <BrainCircuit className="h-5 w-5 text-cyan-400 group-hover:animate-pulse" />
              </div>
            </div>
            <span className="hidden text-xl font-black tracking-tighter text-white sm:block text-glow-hover">TalentForge</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 lg:flex bg-white/5 border border-white/5 rounded-full p-1 backdrop-blur-md">
            {!isAuthenticated ? (
              publicLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => link.hash ? scrollToSection(link.to, link.hash) : navigate(link.to)}
                  className="px-5 py-2 text-sm font-bold text-slate-400 transition-all rounded-full hover:bg-white/10 hover:text-white hover:shadow-sm"
                >
                  {link.label}
                </button>
              ))
            ) : (
              dashboardLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`group relative flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-full overflow-hidden ${
                    isActive(link.to) 
                      ? 'text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive(link.to) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-full" />
                  )}
                  <link.Icon className={`relative z-10 h-4 w-4 transition-transform group-hover:scale-110 ${isActive(link.to) ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-300'}`} />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-cyan-400 hover:scale-110 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 transition-transform group-hover:rotate-90" /> : <Moon className="h-5 w-5 transition-transform group-hover:-rotate-12" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden h-10 items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 lg:flex shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  {user?.plan_type === 'premium' ? <Crown className="h-4 w-4 text-violet-400 animate-pulse" /> : <div className="h-2 w-2 rounded-full bg-cyan-400" />}
                  <span className={`text-xs font-black uppercase tracking-widest ${user?.plan_type === 'premium' ? 'text-violet-300' : 'text-cyan-300'}`}>
                    {user?.plan_type || 'free'}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hidden px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:text-white sm:block">
                  Login
                </Link>
                <Link to="/register" className="gradient-button !px-6 !py-2 !h-10 !text-xs !font-black uppercase tracking-widest">
                  Join Now
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${open ? 'max-h-96 opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}`}>
          <div className="bg-slate-950/95 backdrop-blur-2xl p-4 space-y-2 rounded-b-3xl">
            {!isAuthenticated ? (
              publicLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => link.hash ? scrollToSection(link.to, link.hash) : navigate(link.to)}
                  className="flex w-full items-center px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                >
                  {link.label}
                </button>
              ))
            ) : (
              dashboardLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    isActive(link.to) 
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <link.Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))
            )}
            
            {isAuthenticated && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-pink-400 hover:bg-pink-500/10 rounded-xl transition-all border border-transparent hover:border-pink-500/20"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
