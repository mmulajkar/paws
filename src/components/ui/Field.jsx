export default function Field({ label, required, optional, error, children, hint, htmlFor }) {
  return (
    <label className="block mb-4" htmlFor={htmlFor}>
      <span className="block text-sm font-medium text-stone-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
        {optional && <span className="text-stone-400 font-normal"> (optional)</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-stone-500 mt-1">{hint}</span>}
      {error && (
        <span className="block text-xs text-rose-600 mt-1" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- shared style string, not a component
export const inputCls =
  'w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px]';
