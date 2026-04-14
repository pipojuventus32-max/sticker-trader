import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

function TrackerFallback() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col items-center justify-center px-4">
      <div
        className="glass-strong rounded-2xl px-8 py-10 text-center shadow-lg"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#00a99d]" />
        <p className="mt-4 text-sm font-bold text-slate-700">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<TrackerFallback />}>
      <DashboardPage />
    </Suspense>
  );
}
