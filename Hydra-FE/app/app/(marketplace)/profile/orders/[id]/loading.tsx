import { useId } from 'react';

export default function Loading() {
  const skeletonId = useId();
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="px-4 pt-4 flex items-center gap-3 mb-6">
        <div className="size-8 rounded-full bg-surface-high" />
        <div className="h-6 w-32 bg-surface-high rounded-lg" />
      </div>
      <div className="px-4 gap-y-3">
        {Array.from({ length: 3 }, (_, i) => ({ uid: `${skeletonId}-${i}` })).map((item) => (
          <div key={item.uid} className="h-28 w-full bg-surface-high rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
