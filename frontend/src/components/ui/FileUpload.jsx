import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function FileUpload({ onUpload, multiple = false, accept = 'image/*', maxFiles = 5, className = '' }) {
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setPreviews(prev => {
      const combined = multiple ? [...prev, ...newPreviews] : newPreviews;
      return combined.slice(0, maxFiles);
    });
  }, [multiple, maxFiles]);

  const removePreview = useCallback((index) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (previews.length === 0) return;
    setUploading(true);
    try {
      const files = previews.map(p => p.file);
      await onUpload(multiple ? files : files[0]);
      setPreviews([]);
    } finally {
      setUploading(false);
    }
  }, [previews, onUpload, multiple]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
      >
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleSelect}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200">
                <img src={p.url} alt={p.name} className="w-full h-24 object-cover" />
                <button
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
                <p className="text-xs text-gray-500 truncate px-1">{p.name}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${previews.length} file(s)`}
          </button>
        </>
      )}
    </div>
  );
}
