import { useState } from 'react';
import { Plus, Download, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import GenerateModal from './GenerateModal';
import UploadCSVPanel from './UploadCSVPanel';
import { useBatches, downloadBatchCSV } from '../../hooks/useQRCodes';
import { useProducts } from '../../hooks/useProducts';
import { formatDate } from '../../lib/utils';

export default function QRCodes() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.products || [];

  const { data, isLoading } = useBatches();
  const batches = data?.batches || [];

  const handleDownload = async (batch) => {
    setDownloadingId(batch._id);
    try {
      await downloadBatchCSV(batch._id, batch.name);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const categoryVariant = (cat) => {
    const map = { Electronics: 'blue', Appliances: 'amber', Tools: 'slate', Furniture: 'green', Automotive: 'red' };
    return map[cat] || 'slate';
  };

  return (
    <div className="p-8">
      <PageHeader
        title="QR Code Batches"
        description="Generate serialized QR code batches for your products"
        action={
          <Button onClick={() => setGenerateOpen(true)}>
            <Plus size={16} />
            Generate batch
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: batch table */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Package size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No batches yet</p>
                <p className="text-sm mt-1">Generate your first QR batch to get started</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['', 'Batch name', 'Product', 'Quantity', 'Created', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {batches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 w-14">
                        {b.product?.images?.[0] ? (
                          <img
                            src={b.product.images[0]}
                            alt={b.product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                            <Package size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{b.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{b.product?.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{b.product?.modelNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="blue">{b.quantity.toLocaleString()} codes</Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(b.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(b)}
                          loading={downloadingId === b._id}
                        >
                          <Download size={14} />
                          CSV
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: CSV → PDF panel */}
        <div>
          <UploadCSVPanel />
        </div>
      </div>

      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        products={products}
      />
    </div>
  );
}
