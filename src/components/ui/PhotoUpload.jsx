import { useState } from 'react';
import { Camera } from 'lucide-react';
import Avatar from './Avatar';
import { validatePhotoFile } from '../../services/photosService';

/**
 * Lets the user pick a photo file. Reports the raw File object up via
 * onFileSelected (the caller uploads it to Supabase Storage on save) and
 * shows a local preview in the meantime via object URLs.
 */
export default function PhotoUpload({ previewUrl, onFileSelected, onRemove }) {
  const [localPreview, setLocalPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validatePhotoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLocalPreview(URL.createObjectURL(file));
    onFileSelected(file);
  };

  const shown = localPreview || previewUrl;

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar photo={shown} size="lg" />
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 w-fit min-h-[44px]">
            <Camera size={16} aria-hidden="true" /> {shown ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
          </label>
          {shown && (
            <button
              type="button"
              onClick={() => {
                setLocalPreview(null);
                onRemove();
              }}
              className="text-xs text-stone-500 hover:text-rose-600 text-left"
            >
              Remove photo
            </button>
          )}
          <span className="text-xs text-stone-500">JPG, PNG, WEBP or GIF. Max 5MB.</span>
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-600 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
