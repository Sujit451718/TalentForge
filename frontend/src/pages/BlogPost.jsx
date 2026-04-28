import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  Share2, 
  Bookmark,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getBlogPosts } from '../services/blogData.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function BlogPost() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const posts = getBlogPosts();
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="page-shell space-y-12 animate-in fade-in duration-700">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-cyan-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Insights
        </Link>
        <div className="flex gap-4">
          <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <header className="space-y-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-black uppercase tracking-widest">
          <Tag className="h-3.5 w-3.5" />
          {post.category}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm font-bold text-slate-500 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-xs">
              {post.author.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-white leading-none">{post.author}</p>
              <p className="text-[10px] text-slate-500 mt-1">{post.role}</p>
            </div>
          </div>
          <span className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {post.date}</div>
          <span className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> 8 min read</div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-16">
        {/* Article Body */}
        <article className="prose prose-invert prose-cyan max-w-none">
          <p className="text-xl text-slate-300 leading-relaxed font-medium mb-8">
            {post.excerpt}
          </p>
          <div className="space-y-6 text-slate-400 leading-relaxed text-lg">
            {post.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <h3 className="text-2xl font-bold text-white pt-8">The Core Challenge</h3>
            <p>
              In our experience working with thousands of candidates, the primary obstacle isn't a lack of technical knowledge, 
              but rather the ability to communicate complex ideas under pressure. This article outlines the specific 
              methodologies we've developed to help engineers overcome this hurdle.
            </p>
            <blockquote className="border-l-4 border-cyan-500 pl-6 py-2 my-8 italic text-slate-300 text-xl font-medium bg-cyan-500/5 rounded-r-2xl">
              "Great engineering isn't just about writing code; it's about solving problems for people and being able to explain how you did it."
            </blockquote>
            <p>
              Whether you're preparing for a junior role or a staff-level position, the principles of clarity, structured thinking, 
              and user-centric design remain the same. We encourage you to apply the STAR method not just in behavioral rounds, 
              but also when explaining your technical decisions.
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-12 border-t border-white/5 mt-12">
            {['Career', 'Interview', 'Tech', post.category, 'Expert Advice'].map(t => (
              <span key={t} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-400">
                #{t}
              </span>
            ))}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-12">
          {/* Related Posts */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-widest">More Like This</h3>
            <div className="space-y-4">
              {posts.filter(p => p.id !== post.id && p.category === post.category).slice(0, 3).map(rp => (
                <Link key={rp.id} to={`/blog/${rp.id}`} className="group flex flex-col gap-3">
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                    <img src={rp.image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">{rp.title}</h4>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA Card */}
          <div className="glass-panel p-8 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Ready to practice?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Apply what you've learned in a simulated environment with our advanced AI agents.
            </p>
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="gradient-button w-full !text-xs !py-3">
              {isAuthenticated ? "Go to Dashboard" : "Start Your Prep"}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
