'use client';

import dynamic from 'next/dynamic';

const BodyAnalyzerContent = dynamic(() => import('./BodyAnalyzerContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function BodyAnalyzerPage() {
  return <BodyAnalyzerContent />;
}
