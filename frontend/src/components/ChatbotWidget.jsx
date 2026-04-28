import { MessageSquare, SendHorizontal, X, Bot, User, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { getApiError, userApi } from '../services/api.js';

export default function ChatbotWidget({ enabled }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m your TalentForge AI assistant. How can I help you master your next interview today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!enabled) return null;

  const send = async (e) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await userApi.chatbot(userMessage);
      setMessages(prev => [...prev, { role: 'bot', text: response.data.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: getApiError(error), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-4 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500/20 to-violet-500/20 px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 p-[1px]">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-900">
                  <Bot className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-white leading-none">Forge Assistant</p>
                <p className="mt-1 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Always Active</p>
              </div>
            </div>
            <button 
              type="button" 
              className="group flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 transition-colors" 
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5 text-slate-500 group-hover:text-white" />
            </button>
          </div>

          {/* Chat area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    msg.role === 'user' 
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' 
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-violet-600 text-white rounded-tr-none' 
                      : msg.isError 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-tl-none'
                        : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/5 rounded-tl-none flex gap-1 items-center h-11">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <form onSubmit={send} className="p-6 pt-2 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
            <div className="relative flex items-center">
              <input 
                className="input-field !h-12 !pr-12 !text-xs !bg-white/5 border-white/10" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Ask anything about your career..."
                disabled={loading}
              />
              <button 
                type="submit" 
                className={`absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  message.trim() && !loading 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-slate-600'
                }`}
                disabled={!message.trim() || loading}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        type="button" 
        className={`group relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 active:scale-90 ${
          open ? 'rotate-90 bg-slate-800' : 'bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 hover:scale-110'
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="absolute inset-0 rounded-2xl bg-cyan-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
        {open ? <X className="relative z-10 h-8 w-8 text-white" /> : <MessageSquare className="relative z-10 h-8 w-8 text-white" />}
      </button>
    </div>
  );
}
