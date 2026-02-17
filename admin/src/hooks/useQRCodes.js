import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

export const useBatches = () =>
  useQuery({
    queryKey: ['batches'],
    queryFn: () => api.get('/qrcodes/batches').then((r) => r.data),
  });

// Generate batch — response is a CSV blob, so we use raw fetch to trigger download
export const useGenerateQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity, batchName }) => {
      const token = localStorage.getItem('ow_admin_token');
      const res = await fetch(`${API_URL}/qrcodes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity, batchName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Generation failed');
      }

      // Trigger CSV download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+?)"/);
      a.download = match ? match[1] : `batch-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] });
      toast.success('Batch generated — CSV downloaded');
    },
    onError: (err) => toast.error(err.message || 'Generation failed'),
  });
};

export const downloadBatchCSV = async (batchId, batchName) => {
  const token = localStorage.getItem('ow_admin_token');
  const res = await fetch(`${API_URL}/qrcodes/batches/${batchId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Export failed');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `batch-${batchName}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Uploads CSV and triggers a PDF file download
export const uploadCSVGetPDF = async (file) => {
  const token = localStorage.getItem('ow_admin_token');
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_URL}/qrcodes/pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'PDF generation failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr-labels-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
