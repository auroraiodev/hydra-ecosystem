'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { FlowButton } from '@/features/shared/ui/flow-button';
import { OFFLINE_TEXT } from '../constants';

export function OfflineView() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background antialiased">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-150 animate-pulse" />
        <div className="relative size-24 bg-surface rounded-full flex items-center justify-center border border-border-subtle shadow-soft">
          <WifiOff className="size-10 text-text-muted" />
        </div>
      </div>

      <h1 className="text-2xl lg:text-3xl font-semibold text-text-body mb-3 tracking-tight">
        {OFFLINE_TEXT.TITLE}
      </h1>
      <p className="text-text-muted mb-8 max-w-xs mx-auto leading-relaxed">
        {OFFLINE_TEXT.DESCRIPTION}
      </p>

      <FlowButton
        variant="default"
        size="lg"
        onClick={handleRetry}
        className="w-full sm:w-auto flex items-center justify-center gap-2"
      >
        <RefreshCw className="size-4" />
        {OFFLINE_TEXT.RETRY_BUTTON}
      </FlowButton>
    </div>
  );
}
