'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
        <p className="text-sm font-black text-slate-400 tracking-wider">LOADING QSMS REWORK...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <App />;
}
