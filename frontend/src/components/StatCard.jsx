export default function StatCard({ icon: Icon, label, value, hint, tone = 'cyan' }) {
  const tones = {
    cyan: 'from-cyan-300/20 to-cyan-300/5 text-cyan-200',
    violet: 'from-violet-400/20 to-violet-400/5 text-violet-200',
    rose: 'from-pink-400/20 to-pink-400/5 text-pink-200',
    green: 'from-emerald-400/20 to-emerald-400/5 text-emerald-200',
  };

  return (
    <section className="glass-panel p-5 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">{label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={`grid h-11 w-11 place-items-center bg-gradient-to-br ${tones[tone]}`} style={{ borderRadius: 8 }}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </section>
  );
}
