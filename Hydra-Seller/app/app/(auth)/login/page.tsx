import { Suspense } from 'react';
import { LoginPageContent } from './login-content';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
