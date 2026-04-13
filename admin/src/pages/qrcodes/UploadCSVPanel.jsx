import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { uploadCSVGetPDF } from '../../hooks/useQRCodes';
import { cn } from '../../lib/utils';

export default function UploadCSVPanel() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!file) return toast.error('Please select a CSV file first');
    setLoading(true);
    try {
      await uploadCSVGetPDF(file);
      toast.success('PDF downloaded successfully');
      setFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-9 rounded-xl bg-violet-100 flex items-center justify-center">
          <FileDown size={18} className="text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">CSV to printable PDF</p>
          <p className="text-xs text-slate-500">
            Upload an exported QR codes CSV to get a print-ready label sheet
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-violet-400 bg-violet-50'
            : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
        {isDragActive ? (
          <p className="text-sm text-violet-600 font-medium">Drop it here</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Drag & drop your QR codes CSV
            </p>
            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
          </>
        )}
      </div>

      {/* Selected file */}
      {file && (
        <div className="flex items-center gap-3 mt-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
          <FileText size={16} className="text-violet-600 shrink-0" />
          <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="p-1 rounded hover:bg-violet-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        loading={loading}
        disabled={!file}
        className="w-full mt-4"
      >
        <FileDown size={16} />
        Generate PDF labels
      </Button>

      <p className="text-xs text-slate-400 text-center mt-2">
        PDF is generated as a 3 x 3 grid (9 QR codes per A4 page)
      </p>
    </div>
  );
}
