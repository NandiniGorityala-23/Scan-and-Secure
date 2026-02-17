import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useGenerateQR } from '../../hooks/useQRCodes';

export default function GenerateModal({ open, onClose, products = [] }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchName, setBatchName] = useState('');
  const { mutate, isPending } = useGenerateQR();

  const handleClose = () => {
    setProductId('');
    setQuantity('');
    setBatchName('');
    onClose();
  };

  const submit = (e) => {
    e.preventDefault();
    mutate(
      { productId, quantity: Number(quantity), batchName },
      { onSuccess: handleClose }
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Generate QR batch">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Batch name"
          placeholder="e.g. Galaxy-S24-Jan-2026"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          required
        />
        <p className="text-xs text-slate-400 -mt-2">
          Must be unique — used to identify this batch later.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Product (SKU)</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {p.modelNumber}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Quantity"
          type="number"
          min={1}
          max={10000}
          placeholder="e.g. 500"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <p className="text-xs text-slate-500">
          Each code gets a unique UUID. After generating, the CSV auto-downloads.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Generate &amp; Download CSV
          </Button>
        </div>
      </form>
    </Modal>
  );
}
