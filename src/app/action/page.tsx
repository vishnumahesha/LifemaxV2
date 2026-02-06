'use client';

import dynamic from 'next/dynamic';

const ActionPlanContent = dynamic(() => import('./ActionPlanContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ActionPlanPage() {
  return <ActionPlanContent />;
}
