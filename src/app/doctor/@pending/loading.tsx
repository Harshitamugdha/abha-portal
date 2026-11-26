export default function PendingLoading() {
  return (
    <div className="card p-6 border border-slate-200 animate-pulse">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-5 bg-slate-200 rounded w-16" />
      </div>
      <div className="space-y-3">
        <div className="h-16 bg-slate-100 rounded" />
        <div className="h-16 bg-slate-100 rounded" />
      </div>
    </div>
  );
}
