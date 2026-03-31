import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package, QrCode, CheckCircle, Clock, TrendingUp, Layers, Bell, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../lib/api';
import useAuthStore from '../../store/auth.store';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

const CHART_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#65a30d'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value ?? '-'}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-indigo-500" />
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysLeft(d) {
  const days = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

const TIME_FILTERS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [days, setDays] = useState(30);
  const [triggering, setTriggering] = useState(false);

  const handleTriggerExpiry = async () => {
    setTriggering(true);
    try {
      const { data: result } = await api.post('/admin/trigger-expiry');
      if (result.sent === 0) {
        toast(result.message || 'No warranties to notify right now.', { icon: 'i' });
      } else {
        toast.success(`Sent ${result.sent} expiry reminder${result.sent !== 1 ? 's' : ''}!`);
      }
    } catch {
      toast.error('Failed to trigger expiry notifications.');
    } finally {
      setTriggering(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api.get('/admin/analytics', { params: { days } }).then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-96">
        <Spinner className="size-10" />
      </div>
    );
  }

  const { summary, claimsTimeline, claimsByCategory, productClaimRates, recentClaims } = data || {};

  const labelEvery = days <= 7 ? 1 : days <= 30 ? 5 : 10;
  const timelineData = (claimsTimeline || []).map((d, i) => ({
    ...d,
    label: i % labelEvery === 0 ? formatDate(d.date) : '',
  }));

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here's a live overview of your warranty operations.
          </p>
        </div>
        <button
          onClick={handleTriggerExpiry}
          disabled={triggering}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          {triggering ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
          {triggering ? 'Sending...' : 'Send Expiry Alerts'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Package} label="Total Products (SKUs)" value={summary?.totalProducts} color="bg-indigo-500" />
        <StatCard icon={QrCode} label="QR Codes Generated" value={summary?.totalCodes}
          sub={`${summary?.totalBatches} batch${summary?.totalBatches !== 1 ? 'es' : ''}`} color="bg-violet-500" />
        <StatCard icon={CheckCircle} label="Codes Claimed" value={summary?.totalClaimed}
          sub={`${summary?.claimRate}% claim rate`} color="bg-emerald-500" />
        <StatCard icon={Clock} label="Codes Unclaimed" value={summary?.totalUnclaimed} color="bg-amber-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Claims over time */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Claims - Last {days} Days
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.days}
                  onClick={() => setDays(f.days)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    days === f.days
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="claims"
                name="Claims"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#claimsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#4f46e5' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Claims by category */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={Layers} title="Claims by Category" />
          {claimsByCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={claimsByCategory}
                  dataKey="claimed"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {claimsByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12 }} />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              No claims yet
            </div>
          )}
        </div>
      </div>

      {/* Product claim rates bar chart */}
      {productClaimRates?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={Package} title="Claim Rate by Product (Top 8)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={productClaimRates}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={140}
                tickFormatter={(v) => v.length > 20 ? `${v.slice(0, 20)}...` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Claim rate %" radius={[0, 4, 4, 0]} barSize={14}>
                {productClaimRates.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent claims table */}
      {recentClaims?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <SectionHeader icon={CheckCircle} title="Recent Claims" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Product', 'Customer', 'Claimed', 'Expires', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentClaims.map((c, i) => {
                const days = daysLeft(c.expiresAt);
                const expired = days < 0;
                const expiringSoon = days >= 0 && days <= 30;
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{c.productName}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.modelNumber}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{c.customerName}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{formatFullDate(c.claimedAt)}</td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className={expired ? 'text-red-500 font-medium' : expiringSoon ? 'text-amber-500 font-medium' : 'text-slate-500'}>
                        {formatFullDate(c.expiresAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {expired
                        ? <Badge variant="red">Expired</Badge>
                        : expiringSoon
                          ? <Badge variant="amber">Expiring soon</Badge>
                          : <Badge variant="green">Active</Badge>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!recentClaims?.length && !claimsByCategory?.length && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <p className="text-sm font-semibold text-indigo-800 mb-1">Getting started</p>
          <p className="text-sm text-indigo-600">
            Add your product SKUs under <strong>Products</strong>, generate QR batches under <strong>QR Codes</strong>,
            then scan a QR code from the Customer Portal to see claims appear here.
          </p>
        </div>
      )}
    </div>
  );
}
