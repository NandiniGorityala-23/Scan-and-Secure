import { useState, useEffect, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const CATEGORIES = ['Electronics', 'Appliances', 'Furniture', 'Automotive', 'Tools', 'Other'];
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';
const MAX_IMAGES = 5;

const empty = {
  name: '',
  modelNumber: '',
  category: 'Electronics',
  specifications: '',
  warrantyDurationMonths: '',
  images: [],
};

export default function ProductForm({ initial, onSubmit, loading, submitLabel = 'Save' }) {
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        modelNumber: initial.modelNumber || '',
        category: initial.category || 'Electronics',
        specifications: initial.specifications || '',
        warrantyDurationMonths: initial.warrantyDurationMonths || '',
        images: initial.images || [],
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = MAX_IMAGES - form.images.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    try {
      const token = localStorage.getItem('ow_admin_token');
      const urls = await Promise.all(
        toUpload.map((file) => {
          const fd = new FormData();
          fd.append('image', file);
          return fetch(`${API_URL}/products/upload-image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
            .then((r) => r.json())
            .then((d) => d.url);
        })
      );
      setForm((f) => ({ ...f, images: [...f.images, ...urls.filter(Boolean)] }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, warrantyDurationMonths: Number(form.warrantyDurationMonths) });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Product name"
        name="name"
        placeholder="e.g. UltraCool Air Conditioner"
        value={form.name}
        onChange={handle}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Model number"
          name="modelNumber"
          placeholder="e.g. AC-5000X"
          value={form.modelNumber}
          onChange={handle}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handle}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label="Specifications"
        name="specifications"
        placeholder="e.g. 1.5 Ton, 5-Star Rating, Inverter"
        value={form.specifications}
        onChange={handle}
      />
      <Input
        label="Warranty duration (months)"
        name="warrantyDurationMonths"
        type="number"
        min={1}
        placeholder="e.g. 24"
        value={form.warrantyDurationMonths}
        onChange={handle}
        required
      />

      {/* Image upload */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Product images{' '}
          <span className="text-slate-400 font-normal">
            ({form.images.length}/{MAX_IMAGES})
          </span>
        </label>

        <div className="mt-2 flex flex-wrap gap-3">
          {form.images.map((url, idx) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`product-${idx}`}
                className="w-20 h-20 object-cover rounded-xl border border-slate-200"
              />
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-indigo-600 text-white px-1.5 py-0.5 rounded-md leading-none">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {form.images.length < MAX_IMAGES && (
            <label className="w-20 h-20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 cursor-pointer transition-colors">
              {uploading ? (
                <Spinner className="size-5" />
              ) : (
                <>
                  <ImagePlus size={20} />
                  <span className="text-[10px] mt-1">Add photo</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageFiles}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
