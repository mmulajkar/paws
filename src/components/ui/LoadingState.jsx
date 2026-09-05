export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-400 text-sm" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-emerald-600 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-stone-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-stone-200 rounded w-1/2" />
          <div className="h-3 bg-stone-100 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}
