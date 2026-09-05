import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder, label = 'Search' }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-lg border border-stone-300 pl-10 pr-9 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-2"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
