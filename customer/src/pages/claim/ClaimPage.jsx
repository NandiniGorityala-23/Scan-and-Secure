import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldX, ShieldAlert, ChevronLeft, ChevronRight,
  Calendar, Tag, Cpu, Clock, Download, CheckCircle, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/auth.store';
import { API_BASE_URL } from '../../lib/config';

const API_URL = API_BASE_URL;

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function monthsLabel(n) {
  if (n % 12 === 0) return `${n / 12} year${n / 12 > 1 ? 's' : ''}`;
  return `${n} month${n > 1 ? 's' : ''}`;
}

function daysUntil(d) {
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return null;
  return (
    <div className="relative w-full h-52 bg-slate-100 rounded-2xl overflow-hidden mb-6">
      <img src={images[idx]} alt="product" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            aria-label="Previous product image"
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next product image"
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Show product image ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-indigo-600" />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClaimPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [claimData, setClaimData] = useState(null);
  const [error, setError] = useState(null);
  const [activated, setActivated] = useState(false);
  const [activatedData, setActivatedData] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/claim/${uuid}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'QR code not found');
        setClaimData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [uuid]);

  const handleActivate = async () => {
    if (!token) {
      toast.error('Please sign in to activate your warranty');
      navigate(`/login?redirect=/claim/${uuid}`);
      return;
    }
    setActivating(true);
    try {
      const res = await fetch(`${API_URL}/claim/${uuid}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Activation failed');
      setActivated(true);
      setActivatedData(data);
      toast.success('Warranty activated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActivating(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/claim/${uuid}/certificate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warranty-certificate-${uuid.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // ── Layout shell ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
            <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Looking up warranty info...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="size-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <ShieldX size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">QR Code Not Found</h1>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <p className="text-xs text-slate-400">Make sure you scanned the correct QR code from your product packaging.</p>
          </div>
        )}

        {/* Already claimed by current user */}
        {!loading && !error && claimData?.status === 'claimed' && !activated && token && claimData.claimedById === (user?.id || user?._id) && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-8 py-6">
              <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Your Warranty</h1>
              <p className="text-emerald-100 text-sm mt-1">You have already registered this product</p>
            </div>
            <div className="px-8 py-6">
              <ImageCarousel images={claimData.product.images} />
              <h2 className="font-bold text-slate-900 text-lg mb-1">{claimData.product.name}</h2>
              <p className="text-sm text-slate-400 font-mono mb-5">{claimData.product.modelNumber}</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">REGISTERED ON</p>
                    <p className="font-bold text-emerald-900 mt-0.5">{formatDate(claimData.claimedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-700 font-medium">EXPIRES ON</p>
                    <p className="font-bold text-emerald-900 mt-0.5">{formatDate(claimData.expiresAt)}</p>
                  </div>
                </div>
              </div>
              <InfoRow icon={Calendar} label="Expires on" value={formatDate(claimData.expiresAt)} highlight />
              <InfoRow icon={Clock} label="Warranty duration" value={monthsLabel(claimData.product.warrantyDurationMonths)} />
              <InfoRow icon={Tag} label="Category" value={claimData.product.category} />
              <button
                onClick={handleDownloadCertificate}
                disabled={downloading}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating...</>
                ) : (
                  <><Download size={16} /> Download Certificate</>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full mt-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Back to home
              </button>
            </div>
          </div>
        )}

        {/* Already claimed by someone else */}
        {!loading && !error && claimData?.status === 'claimed' && !activated && !(token && claimData.claimedById === (user?.id || user?._id)) && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-b from-red-600 to-red-700 px-8 py-8 text-center">
              <div className="size-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Warning</h1>
              <p className="text-red-100 text-sm leading-relaxed">
                This QR code has already been registered.<br />
                This product may be <strong>counterfeit or unauthorised</strong>.
              </p>
            </div>
            <div className="px-8 py-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                <p className="text-sm font-bold text-red-800 mb-2">What this means</p>
                <ul className="text-sm text-red-700 space-y-1.5 list-disc list-inside">
                  <li>Each genuine product has a unique, one-time QR code</li>
                  <li>This code was already used to register a warranty</li>
                  <li>If you bought this product new, it may be a fake</li>
                </ul>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Product</p>
                <p className="font-bold text-slate-900">{claimData.product.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{claimData.product.modelNumber}</p>
              </div>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Contact the retailer or manufacturer with your purchase receipt if you believe your product is genuine.
              </p>
            </div>
          </div>
        )}

        {/* Unclaimed and ready to activate */}
        {!loading && !error && claimData?.status === 'unclaimed' && !activated && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-indigo-600 to-violet-600 px-8 py-6">
              <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Activate Your Warranty</h1>
              <p className="text-indigo-200 text-sm mt-1">Register this product to start your warranty</p>
            </div>
            <div className="px-8 py-6">
              <ImageCarousel images={claimData.product.images} />
              <h2 className="font-bold text-slate-900 text-lg mb-1">{claimData.product.name}</h2>
              <p className="text-sm text-slate-400 font-mono mb-5">{claimData.product.modelNumber}</p>

              <div className="divide-y divide-slate-100 mb-6">
                <InfoRow icon={Clock} label="Warranty duration" value={monthsLabel(claimData.product.warrantyDurationMonths)} highlight />
                <InfoRow icon={Tag} label="Category" value={claimData.product.category} />
                {claimData.product.specifications && (
                  <InfoRow icon={Cpu} label="Specifications" value={claimData.product.specifications} />
                )}
              </div>

              {!token ? (
                <div>
                  <p className="text-sm text-slate-500 mb-4 text-center">
                    Sign in to your OmniWarranty account to activate this warranty.
                  </p>
                  <button
                    onClick={() => navigate(`/login?redirect=/claim/${uuid}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Sign in to Activate
                  </button>
                  <button
                    onClick={() => navigate(`/register?redirect=/claim/${uuid}`)}
                    className="w-full mt-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    Create account
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-indigo-50 rounded-xl p-3 mb-4 text-center">
                    <p className="text-xs text-indigo-600">
                      Activating as <strong>{user?.name}</strong>
                    </p>
                  </div>
                  <button
                    onClick={handleActivate}
                    disabled={activating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {activating ? (
                      <><Loader2 size={16} className="animate-spin" /> Activating...</>
                    ) : (
                      <><ShieldCheck size={16} /> Activate Warranty</>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 text-center mt-3">
                    This is a one-time action and cannot be undone.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success state after activation */}
        {activated && activatedData && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 px-8 py-8 text-center">
              <div className="size-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Warranty Activated!</h1>
              <p className="text-emerald-100 text-sm">Your product is now registered and protected</p>
            </div>

            <div className="px-8 py-6">
              <ImageCarousel images={activatedData.product.images} />
              <h2 className="font-bold text-slate-900 text-lg mb-1">{activatedData.product.name}</h2>
              <p className="text-sm text-slate-400 font-mono mb-5">{activatedData.product.modelNumber}</p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">REGISTERED ON</p>
                    <p className="font-bold text-emerald-900 mt-0.5">{formatDate(activatedData.claimedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-700 font-medium">EXPIRES ON</p>
                    <p className="font-bold text-emerald-900 mt-0.5">{formatDate(activatedData.expiresAt)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-xs text-emerald-700 text-center">
                    {daysUntil(activatedData.expiresAt)} days of warranty coverage remaining
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadCertificate}
                disabled={downloading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mb-3"
              >
                {downloading ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating...</>
                ) : (
                  <><Download size={16} /> Download Warranty Certificate</>
                )}
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Back to home
              </button>
            </div>
          </div>
        )}

        {/* Branding footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          OmniWarranty - Fraud-proof digital warranty management
        </p>
      </div>
    </div>
  );
}
