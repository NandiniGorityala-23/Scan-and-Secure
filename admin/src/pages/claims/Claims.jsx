import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../../lib/api';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../lib/utils';

function daysLeft(d) {
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(expiresAt) {
  if (!expiresAt) return <Badge variant="slate">—</Badge>;
  const days = daysLeft(expiresAt);
  if (days < 0) return <Badge variant="red">Expired</Badge>;
  if (days <= 30) return <Badge variant="amber">Expiring in {days}d</Badge>;
  return <Badge variant="green">Active</Badge>;
}

function monthsLabel(n) {
  if (!n) return '—';
  if (n % 12 === 0) return `${n / 12}yr`;
  return `${n}mo`;
}

export default function Claims() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['claims', page, statusFilter],
    queryFn: () =>
      api.get('/admin/claims', { params: { page, limit: LIMIT, status: statusFilter } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const claims = data?.claims || [];
  const filtered = search
    ? claims.filter(
        (c) =>
          c.productName?.toLowerCase().includes(search.toLowerCase()) ||
          c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          c.modelNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : claims;

  return (
    <div className="p-8">
      <PageHeader
        title="Claims"
        description="All warranty activations across your products"
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring soon (≤30 days)</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShieldCheck size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No claims yet</p>
            <p className="text-sm mt-1">Claims will appear here once customers scan and activate their QR codes</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Product', 'Customer', 'Category', 'Duration', 'Claimed', 'Expires', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{c.productName}</p>
                    <p className="text-xs text-slate-400 font-mono">{c.modelNumber}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-800 font-medium">{c.customerName}</p>
                    <p className="text-xs text-slate-400">{c.customerEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="blue">{c.category}</Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-xs font-medium">
                    {monthsLabel(c.warrantyDurationMonths)}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(c.claimedAt)}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {c.expiresAt ? formatDate(c.expiresAt) : '—'}
                  </td>
                  <td className="px-5 py-4">{expiryBadge(c.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>{data.total} claims total</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {page} of {data.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
