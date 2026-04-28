import { CheckCircle2, Crown, X } from 'lucide-react';
import Spinner from './Spinner.jsx';

export default function UpgradeModal({ open, loading, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <section className="glass-panel w-full max-w-md p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center bg-violet-400/15 text-violet-200" style={{ borderRadius: 8 }}>
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">Upgrade to Premium</h2>
              <p className="text-sm text-slate-400">Payment is simulated for this project.</p>
            </div>
          </div>
          <button className="ghost-button !px-2.5" type="button" onClick={onClose} aria-label="Close upgrade modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          {['Unlimited interviews', 'Advanced AI-style questions', 'Resume-based interview rounds', 'Detailed analytics and feedback'].map((item) => (
            <p key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              {item}
            </p>
          ))}
        </div>

        <button className="gradient-button mt-6 w-full" type="button" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner label="Processing" /> : 'Simulate Payment Success'}
        </button>
      </section>
    </div>
  );
}
