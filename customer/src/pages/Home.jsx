import { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, LogOut, ScanLine, ChevronRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import api from '../lib/api';
import { formatWarrantyDate, warrantyStatus } from '../lib/warranty';

function MiniStatusBadge({ expiresAt }) {
  const status = warrantyStatus(expiresAt);
  if (status.tone === 'expired') return <span className="text-xs text-red-400 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> Expired</span>;
  if (status.tone === 'expiring') return <span className="text-xs text-amber-400 font-semibold flex items-center gap-1"><Clock size={10} /> {status.days}d left</span>;
  return <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle size={10} /> Active</span>;
}

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [warranties, setWarranties] = useState([]);
  const [loadingW, setLoadingW] = useState(true);

  useEffect(() => {
    api.get('/claim/my/warranties')
      .then((r) => setWarranties(r.data.warranties.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingW(false));
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 to-slate-900 p-4 pb-24">
      <div className="w-full max-w-lg mx-auto py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">OmniWarranty</h1>
              <p className="text-slate-400 text-xs">Welcome, {user?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>

        {/* Scan CTA */}
        <Link
          to="/scan"
          className="flex items-center justify-center gap-2 w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-4 rounded-2xl mb-6 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <ScanLine size={22} />
          Scan QR Code to Claim Warranty
        </Link>

        {/* Recent Warranties preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-300" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recent Warranties</span>
            </div>
            <button
              onClick={() => navigate('/warranties')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          {loadingW ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="bg-white/5 rounded-xl h-16 animate-pulse" />)}
            </div>
          ) : warranties.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <p className="text-slate-400 text-sm">No warranties yet. Scan your first product!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {warranties.map((w) => (
                <div key={w.uuid} className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl p-3 hover:bg-white/12 transition-colors">
                  {w.product.images?.[0] ? (
                    <img src={w.product.images[0]} alt={w.product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{w.product.name}</p>
                    <p className="text-slate-500 text-xs">Expires {formatWarrantyDate(w.expiresAt)}</p>
                  </div>
                  <MiniStatusBadge expiresAt={w.expiresAt} />
                </div>
              ))}
              {warranties.length === 3 && (
                <button
                  onClick={() => navigate('/warranties')}
                  className="w-full text-xs text-indigo-400 hover:text-indigo-300 py-2 text-center transition-colors"
                >
                  View all warranties →
                </button>
              )}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <QrCode size={15} className="text-indigo-300" />
            <p className="text-white font-medium text-sm">How it works</p>
          </div>
          <ol className="space-y-1.5 text-sm text-slate-400 list-decimal list-inside">
            <li>Find the QR code on your product or packaging</li>
            <li>Tap <span className="text-white font-medium">Scan QR Code</span> above</li>
            <li>Activate your warranty with one tap</li>
            <li>Download your warranty certificate anytime</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
