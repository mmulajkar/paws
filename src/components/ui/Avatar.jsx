import { Dog } from 'lucide-react';

export default function Avatar({ photo, size = 'md', name = '' }) {
  const dims = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-28 h-28' : 'w-14 h-14';
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 44 : 24;
  return (
    <div className={`${dims} rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200`}>
      {photo ? (
        <img src={photo} alt={name ? `Photo of ${name}` : ''} className="w-full h-full object-cover" />
      ) : (
        <Dog size={iconSize} className="text-emerald-600" aria-hidden="true" />
      )}
    </div>
  );
}
