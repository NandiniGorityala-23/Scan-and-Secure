import { useState } from 'react';
import { Plus, Upload, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ProductForm from './ProductForm';
import ImportCSVModal from './ImportCSVModal';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { warrantyLabel, formatDate } from '../../lib/utils';

export default function Products() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useProducts({ search, page, limit: 10 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleCreate = (formData) => {
    createProduct.mutate(formData, { onSuccess: () => setAddOpen(false) });
  };

  const handleUpdate = (formData) => {
    updateProduct.mutate(
      { id: editTarget._id, data: formData },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const handleDelete = () => {
    deleteProduct.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Products"
        description="Manage your product catalog (SKUs)"
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload size={16} />
              Import CSV
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Add product
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or model..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-8" />
          </div>
        ) : data?.products?.length === 0 ? (
          <EmptyState title="No products yet" description="Add your first SKU to get started" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['', 'Product', 'Model', 'Category', 'Warranty', 'Added', ''].map((h) => (
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
              {data.products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 w-14">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.specifications && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {p.specifications}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-mono text-xs">{p.modelNumber}</td>
                  <td className="px-5 py-4">
                    <Badge variant="blue">{p.category}</Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{warrantyLabel(p.warrantyDurationMonths)}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditTarget(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>{data.total} products total</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page} of {data.pages}
            </span>
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

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add product">
        <ProductForm onSubmit={handleCreate} loading={createProduct.isPending} submitLabel="Create product" />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit product">
        <ProductForm
          initial={editTarget}
          onSubmit={handleUpdate}
          loading={updateProduct.isPending}
          submitLabel="Save changes"
        />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product">
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900">{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteProduct.isPending}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Import CSV Modal */}
      <ImportCSVModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
