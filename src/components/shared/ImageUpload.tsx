import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { uploadAttachment } from '../../backend';
import { uid } from '../../lib/format';
import { Button, Input } from '../ui';

const MAX_SIDE = 1600;
const QUALITY = 0.8;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

// Resize to at most MAX_SIDE px on the long edge and re-encode as WebP, so phone photos
// (often 3–5 MB) upload quickly and stay small enough for the site to load fast.
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Unable to encode image'))), 'image/webp', QUALITY)
  );
}

async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Image is larger than 20 MB.');
  const blob = await compressImage(file);
  const name = `${uid()}.webp`;
  return uploadAttachment(`${folder}/${name}`, new File([blob], name, { type: 'image/webp' }));
}

function useImageUploader(folder: string) {
  const [uploading, setUploading] = useState(false);
  const upload = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) urls.push(await uploadImage(file, folder));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to upload the image.');
    } finally {
      setUploading(false);
    }
    return urls;
  };
  return { uploading, upload };
}

function UrlAdder({ onAdd, label }: { onAdd: (url: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Link2 size={14} /> {label}
      </Button>
    );
  }
  const add = () => {
    if (url.trim()) onAdd(url.trim());
    setUrl('');
    setOpen(false);
  };
  return (
    <div className="flex w-full gap-2">
      <Input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        placeholder="https://… or /projects/…/photo.webp"
      />
      <Button type="button" variant="outline" onClick={add}>Use</Button>
    </div>
  );
}

/** A single image (e.g. a service's cover photo) that can be uploaded, replaced by URL, or previewed. */
export function ImageField({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useImageUploader(folder);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-agdark-100 bg-agdark-50 sm:w-44">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={22} className="text-agdark-300" />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? null : <Upload size={14} />} {value ? 'Replace image' : 'Upload image'}
          </Button>
          <UrlAdder label="Use a URL" onAdd={onChange} />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          const [url] = await upload(files.slice(0, 1));
          if (url) onChange(url);
        }}
      />
    </div>
  );
}

/** An ordered list of images that can be uploaded (several at once), reordered, and removed. */
export function GalleryField({ value, onChange, folder }: { value: string[]; onChange: (urls: string[]) => void; folder: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useImageUploader(folder);

  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const add = (urls: string[]) => onChange([...value, ...urls.filter((u) => !value.includes(u))]);

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((src, i) => (
            <li key={src} className="overflow-hidden rounded-lg border border-agdark-100 bg-white">
              <img src={src} alt="" className="h-24 w-full bg-agdark-50 object-cover" />
              <div className="flex items-center justify-between px-1 py-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded p-1.5 text-agdark-400 hover:bg-agdark-100 hover:text-agdark-700 disabled:opacity-30" aria-label="Move earlier">
                  <ArrowLeft size={14} />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded p-1.5 text-agdark-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove image">
                  <Trash2 size={14} />
                </button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, i + 1)} className="rounded p-1.5 text-agdark-400 hover:bg-agdark-100 hover:text-agdark-700 disabled:opacity-30" aria-label="Move later">
                  <ArrowRight size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-agdark-400">No images yet.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? null : <Upload size={14} />} Upload images
        </Button>
        <UrlAdder label="Add by URL" onAdd={(url) => add([url])} />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          add(await upload(files));
        }}
      />
    </div>
  );
}
