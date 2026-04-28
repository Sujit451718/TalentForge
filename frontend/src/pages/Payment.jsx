import { CreditCard, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiError, paymentApi } from '../services/api.js';

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const pay = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await paymentApi.simulate();
      updateUser({ ...user, plan_type: response.data.data.plan_type });
      setMessage('Payment successful. Premium is now active.');
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[calc(100vh-84px)] items-center justify-center">
      <section className="glass-panel w-full max-w-lg p-6">
        <p className="label text-cyan-200">Payment</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Complete your premium upgrade</h1>
        <p className="mt-4 flex items-center gap-2 text-2xl font-black text-white">
          <IndianRupee className="h-6 w-6" /> 749 / month
        </p>
        <p className="mt-2 text-sm text-slate-400">This demo uses simulated payment confirmation.</p>
        {error ? <p className="mt-4 border border-pink-300/20 bg-pink-300/10 p-3 text-sm text-pink-100" style={{ borderRadius: 8 }}>{error}</p> : null}
        {message ? <p className="mt-4 border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100" style={{ borderRadius: 8 }}>{message}</p> : null}
        <button className="gradient-button mt-6 w-full" type="button" onClick={pay} disabled={loading}>
          {loading ? <Spinner label="Processing payment" /> : <><CreditCard className="h-4 w-4" /> Pay Now</>}
        </button>
      </section>
    </main>
  );
}
