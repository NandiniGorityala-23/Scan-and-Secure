import { useState, useEffect } from 'react';
import { ShieldCheck, Download, AlertTriangle, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { API_BASE_URL } from '../lib/config';

function daysLeft(d) {
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ expiresAt }) {
  const days = daysLeft(expiresAt);
  if (days < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
        <AlertTriangle size={11} /> Expired
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
        <Clock size={11} /> Expires in {days}d
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
      <CheckCircle size={11} /> Active
    </span>
  );
}

export default function Warranties() {
  const navigate = useNavigate();
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/claim/my/warranties')
      .then((r) => setWarranties(r.data.warranties))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (uuid) => {
    const token = localStorage.getItem('ow_customer_token');
    const url = `${API_BASE_URL}/claim/${uuid}/certificate`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `warranty-${uuid.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 to-slate-900 p-4">
      <div className="w-full max-w-lg mx-auto py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="size-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">My Warranties</h1>
            <p className="text-slate-400 text-xs">{warranties.length} registered product{warranties.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : warranties.length === 0 ? (
          <div className="bg-white/8 border border-white/12 rounded-2xl p-10 text-center">
            <ShieldCheck size={40} className="text-slate-500 mx-auto mb-4" />
            <p className="text-white font-semibold mb-1">No warranties yet</p>
            <p className="text-slate-400 text-sm">Scan the QR code on your product to register your first warranty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {warranties.map((w) => {
              const { uuid, claimedAt, expiresAt, product } = w;
              const image = product.images?.[0];
              const days = daysLeft(expiresAt);

              return (
                <div key={uuid} className="bg-white/8 border border-white/12 rounded-2xl overflow-hidden">
                  {image && (
                    <img src={image} alt={product.name} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-white text-base">{product.name}</p>
                        <p className="text-slate-400 text-xs font-mono mt-0.5">{product.modelNumber}</p>
                      </div>
                      <StatusBadge expiresAt={expiresAt} />
                    </div>

                    <p className="text-slate-400 text-xs mb-4">{product.category}</p>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-slate-500 text-xs mb-0.5">Registered</p>
                        <p className="text-white text-xs font-semibold">{formatDate(claimedAt)}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${days < 0 ? 'bg-red-500/10' : days <= 30 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                        <p className="text-slate-500 text-xs mb-0.5">Expires</p>
                        <p className={`text-xs font-semibold ${days < 0 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatDate(expiresAt)}
                        </p>
                      </div>
                    </div>

                    {product.specifications && (
                      <p className="text-slate-500 text-xs mb-4 line-clamp-2">{product.specifications}</p>
                    )}

                    <button
                      onClick={() => handleDownload(uuid)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/30 py-2.5 rounded-xl transition-colors"
                    >
                      <Download size={15} />
                      Download Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
