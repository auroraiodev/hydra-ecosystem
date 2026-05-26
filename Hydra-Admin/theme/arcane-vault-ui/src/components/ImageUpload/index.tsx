'use client';
import * as React from 'react';
import { Camera, ImageOff, X, Upload, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Spinner } from '../Spinner';

export interface ImageUploadProps {
  /** Current image URL (from the server) */
  value: string;
  /** Called with the new URL after a successful upload, or '' after removal */
  onChange: (url: string) => void;
  /**
   * App provides the actual upload logic.
   * Should resolve to the new remote URL on success.
   * Throw to signal failure — the component resets the preview.
   */
  onUpload: (file: File) => Promise<string>;
  /** Called when the current image is removed (before onChange('') fires) */
  onRemove?: (url: string) => void | Promise<void>;
  disabled?: boolean;
  /** Max file size in bytes — default 5 MB */
  maxSize?: number;
  className?: string;
}

function ImageUploadInner({
  value,
  onChange,
  onUpload,
  onRemove,
  disabled,
  maxSize = 5 * 1024 * 1024,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [broken, setBroken] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > maxSize) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setBroken(false);
    setUploading(true);

    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      console.error('Upload failed:', err);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      setBroken(true);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  React.useEffect(() => {
    if (preview && value && (value.includes(preview) || !uploading)) {
      const timer = setTimeout(() => {
        setPreview(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value, preview, uploading]);

  const handleRemove = async () => {
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    if (value && onRemove) await onRemove(value);
    onChange('');
  };

  const displaySrc = preview ?? value;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div 
        role="button"
        tabIndex={disabled || displaySrc || uploading ? -1 : 0}
        className={cn(
          "relative w-full aspect-video rounded-xl overflow-hidden border border-border-subtle bg-surface-low group transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50",
          !disabled && !displaySrc && "cursor-pointer hover:border-primary/50 hover:bg-surface"
        )}
        onClick={() => !disabled && !displaySrc && !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && !displaySrc && !uploading && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {displaySrc ? (
          <div className="relative h-full w-full group">
            <img
              key={displaySrc}
              src={displaySrc}
              alt="Preview"
              className={cn(
                'size-full object-cover transition-all duration-500',
                broken ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
                uploading ? 'brightness-50 blur-[2px]' : 'brightness-100 blur-0'
              )}
              onLoad={() => setBroken(false)}
              onError={() => setBroken(true)}
            />
            
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" />
              </div>
            )}

            {!disabled && !uploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all hover:scale-110 active:scale-95"
                  title="Cambiar imagen"
                >
                  <Upload className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="p-2.5 rounded-full bg-red-500/40 hover:bg-red-500/60 text-white transition-all hover:scale-110 active:scale-95"
                  title="Eliminar imagen"
                >
                  <X className="size-5" />
                </button>
              </div>
            )}

            {broken && !uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-low p-4 text-center text-text-muted">
                <AlertCircle className="size-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">Error al cargar imagen</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setBroken(false); }}
                  className="mt-2 text-[10px] uppercase tracking-wider font-bold hover:text-primary transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full gap-3 p-6">
            {uploading ? (
              <Spinner label="Subiendo..." />
            ) : (
              <>
                <div className="p-4 rounded-full bg-surface group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  <Camera className="size-8 opacity-70" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-text">Haz clic para subir imagen</p>
                  <p className="text-xs text-text-muted mt-1">PNG, JPG o WebP hasta 5MB</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />
    </div>
  );
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onRemove,
  disabled,
  maxSize,
  className,
}: ImageUploadProps) {
  return <ImageUploadInner 
    key={value}
    value={value}
    onChange={onChange}
    onUpload={onUpload}
    onRemove={onRemove}
    disabled={disabled}
    maxSize={maxSize}
    className={className} 
  />;
}