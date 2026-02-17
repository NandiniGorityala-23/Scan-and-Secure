import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useImportProducts } from '../../hooks/useProducts';
import { cn } from '../../lib/utils';

const TEMPLATE_CSV =
  'name,model_number,category,specifications,warranty_duration_months\n' +
  'Sample Product,MODEL-001,Electronics,"128GB Storage",24\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportCSVModal({ open, onClose }) {
  const [file, setFile] = useState(null);
  const { mutate, isPending } = useImportProducts();

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleImport = () => {
    if (!file) return toast.error('Please select a CSV file');

    const fd = new FormData();
    fd.append('file', file);

    mutate(fd, {
      onSuccess: () => {
        setFile(null);
        onClose();
      },
    });
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import products from CSV">
      <div className="space-y-4">
        {/* Template download */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-700">Need a template?</p>
            <p className="text-xs text-slate-500">Download the sample CSV to get started</p>
          </div>
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>
            <Download size={14} />
            Template
          </Button>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto text-slate-400 mb-3" />
          {isDragActive ? (
            <p className="text-sm text-indigo-600 font-medium">Drop it here</p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700">
                Drag & drop a CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </>
          )}
        </div>

        {/* Selected file */}
        {file && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <FileText size={18} className="text-indigo-600 shrink-0" />
            <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* CSV format hint */}
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
          <p className="font-medium text-slate-600 mb-1">Required columns:</p>
          <code className="block text-slate-500">
            name, model_number, category, specifications, warranty_duration_months
          </code>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} loading={isPending} disabled={!file}>
            Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
