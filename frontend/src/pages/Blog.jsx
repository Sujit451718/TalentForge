import { 
  BookOpen, 
  User, 
  Calendar, 
  ChevronRight, 
  ArrowLeft,
  Search,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBlogPosts } from '../services/blogData.js';

const blogPosts = getBlogPosts().filter(post => post.image && post.image.length > 0);

export default function Blog() {
  return (
    <main className="page-shell space-y-12">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 p-12 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-cyan-500/10 blur-[100px] animate-pulse" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 font-bold text-sm hover:underline mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <h1 className="text-5xl font-black text-white tracking-tight leading-none">
              Expert <span className="text-cyan-400">Insights</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium">
              Daily deep dives into technical excellence, interview strategies, and industry trends from world-class engineers.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <BookOpen className="h-12 w-12 text-violet-400" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{blogPosts.length}+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Articles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Categories */}
      <section className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search articles..." 
            className="input-field !pl-12 !h-14"
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto">
          {['All', 'System Design', 'Frontend', 'Backend', 'Soft Skills'].map(cat => (
            <button key={cat} className="px-6 py-3 rounded-xl border border-white/5 bg-white/5 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap">
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Blog Grid */}
      <section className="grid md:grid-cols-2 gap-8">
        {blogPosts.map((post) => (
          <article key={post.id} className="glass-panel group overflow-hidden border-white/5 hover:border-cyan-500/30 transition-all duration-500">
            <div className="aspect-[16/9] overflow-hidden relative">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-4 left-4">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  <Tag className="h-3 w-3" />
                  {post.category}
                </span>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {post.date}</span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {post.author}</span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">{post.title}</h2>
              <p className="text-slate-400 leading-relaxed font-medium line-clamp-2">
                {post.excerpt}
              </p>
              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white leading-none">{post.author}</p>
                    <p className="text-[9px] font-medium text-slate-500 mt-1">{post.role}</p>
                  </div>
                </div>
                <Link to={`/blog/${post.id}`} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white hover:text-cyan-400 transition-colors">
                  Read More <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Newsletter */}
      <section className="glass-panel p-12 text-center space-y-6 bg-gradient-to-b from-transparent to-white/[0.02]">
        <h2 className="text-3xl font-black text-white">Get Weekly Insights</h2>
        <p className="text-slate-400 max-w-xl mx-auto font-medium">Join 5,000+ engineers receiving the best interview prep advice directly in their inbox.</p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input type="email" placeholder="you@example.com" className="input-field !h-14" />
          <button className="gradient-button !h-14 whitespace-nowrap">Subscribe Now</button>
        </div>
      </section>
    </main>
  );
}
