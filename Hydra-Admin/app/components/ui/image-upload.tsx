'use client';
import { ImageUpload as DSImageUpload } from 'arcane-vault-ui';
import { uploadAPI } from '@/lib/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/utils/imageUrl';

function extractKey(url: string): string | null {
  const m = url.match(/\/api\/v1\/images\/(.+)$/);
  return m ? m[1] : null;
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const handleUpload = async (file: File): Promise<string> => {
    const result = await uploadAPI.image(file, value);
    if (result.success && result.data?.url) {
      toast.success('Imagen subida correctamente');
      return result.data.url;
    }
    toast.error('Error al subir la imagen');
    throw new Error('Upload failed');
  };

  const handleRemove = async (url: string) => {
    const key = extractKey(url);
    if (key) uploadAPI.deleteImage(key).catch(() => {});
  };

  return (
    <DSImageUpload
      value={resolveImageUrl(value)}
      onChange={onChange}
      onUpload={handleUpload}
      onRemove={handleRemove}
      disabled={disabled}
    />
  );
}
