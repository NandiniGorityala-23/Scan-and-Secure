import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, X, ScanLine, FileImage, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

// Extract UUID from a claim URL or return the raw value if it's already a UUID
function extractUUID(decoded) {
  try {
    const url = new URL(decoded);
    const parts = url.pathname.split('/');
    const claimIndex = parts.indexOf('claim');
    if (claimIndex !== -1 && parts[claimIndex + 1]) {
      return parts[claimIndex + 1];
    }
  } catch {
    // Not a URL — treat the whole decoded string as the UUID
    return decoded.trim();
  }
  return null;
}

// Decode a QR code from an <img> element drawn onto an offscreen canvas
function decodeImageElement(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height);
}

export default function Scanner() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Camera refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const handleDecoded = useCallback(
    (result) => {
      const uuid = extractUUID(result.data);
      if (uuid) {
        navigate(`/claim/${uuid}`);
      } else {
        setError('QR code found but could not extract a valid claim ID.');
      }
    },
    [navigate]
  );

  // --- FILE UPLOAD ---
  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const result = decodeImageElement(img);
        if (result) {
          handleDecoded(result);
        } else {
          setError('No QR code detected in this image. Try a clearer photo.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e) => processFile(e.target.files[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  // --- WEBCAM ---
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      scanFrame();
    } catch {
      setError('Camera access denied. Use file upload instead.');
      setMode('upload');
    }
  };

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height);

    if (result) {
      stopCamera();
      handleDecoded(result);
    } else {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, stopCamera]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <ScanLine size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Scan QR Code</h1>
          <p className="text-slate-400 text-sm mt-1">
            Use your webcam or upload a QR code image
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-5">
          {[
            { key: 'upload', icon: FileImage, label: 'Upload Image' },
            { key: 'camera', icon: Camera, label: 'Use Webcam' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === key
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
              dragOver
                ? 'border-indigo-400 bg-white/20'
                : 'border-white/30 hover:border-white/50 bg-white/5'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload size={32} className="mx-auto text-slate-400 mb-3" />
            <p className="text-white font-medium">Drop a QR code image here</p>
            <p className="text-slate-400 text-sm mt-1">or click to browse your files</p>
            <p className="text-slate-500 text-xs mt-3">PNG, JPG, GIF accepted</p>
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-48 border-2 border-white/60 rounded-xl relative">
                <span className="absolute top-0 left-0 size-5 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                <span className="absolute top-0 right-0 size-5 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                <span className="absolute bottom-0 left-0 size-5 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                <span className="absolute bottom-0 right-0 size-5 border-b-4 border-r-4 border-indigo-400 rounded-br" />
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/60">
              Point camera at a QR code
            </p>
            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mx-auto mt-5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <X size={14} />
          Back to home
        </button>
      </div>
    </div>
  );
}
