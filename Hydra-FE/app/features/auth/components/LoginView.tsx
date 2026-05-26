'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { sanitizeUrlError } from '@/lib/sanitize';
import { Link } from '@/features/shared/ui';
import { LoginForm } from './LoginForm';
import { LOGIN_CONSTANTS } from '../constants';

function LoginContent() {
  const searchParams = useSearchParams();
  const { error: showError } = useToastContext();

  // Handle error from URL (e.g., OAuth callback errors)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const decodedError = sanitizeUrlError(error);
      showError(decodedError);
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.pathname);
    }
  }, [searchParams, showError]);

  return (
    <div className="dark-auth bg-background text-text-body font-sans min-h-[100dvh] flex transition-colors duration-200 bg-gradient-to-br from-teal/5 via-teal/2 to-transparent overflow-hidden">
      {/* Left Section — Branding (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-transparent relative overflow-hidden">
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-teal/10 transition-colors text-text-muted hover:text-teal z-10"
        >
          <ArrowLeft className="text-2xl" />
        </Link>

        <div className="text-center max-w-md z-10">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-teal/15 rounded-full blur-[60px] scale-150" />
              <Image
                src="/cat.png"
                alt="Hydra Collectables Logo"
                width={180}
                height={180}
                priority
                className="object-contain mx-auto mb-6 drop-shadow-[0_20px_50px_rgba(var(--glow-teal-rgb) / 0.25)] relative z-10 hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h1 className="text-5xl font-semibold tracking-tight mb-4">
              <span className="text-teal">{LOGIN_CONSTANTS.BRANDING.TITLE_1}</span>
              <br />
              <span className="text-text-body">{LOGIN_CONSTANTS.BRANDING.TITLE_2}</span>
            </h1>
            <p className="text-text-muted text-base leading-relaxed max-w-xs mx-auto">
              {LOGIN_CONSTANTS.BRANDING.SUBTITLE}
            </p>
          </div>
        </div>

        {/* Decorative glows */}
        <div className="absolute top-20 left-10 size-[300px] bg-teal/4 rounded-full blur-[80px]" />
        <div className="absolute bottom-40 left-20 size-[200px] bg-teal/3 rounded-full blur-[60px]" />
      </div>

      {/* Right Section — Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative overflow-y-auto no-scrollbar">
        {/* Mobile back button */}
        <Link
          href="/"
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-teal/10 transition-colors text-text-muted hover:text-teal lg:hidden z-10"
        >
          <ArrowLeft className="text-2xl" />
        </Link>

        {/* Mobile Logo */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:hidden">
          <Image
            src="/cat.png"
            alt="Hydra Collectables Logo"
            width={60}
            height={60}
            priority
            className="object-contain"
          />
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

export function LoginView() {
  return (
    <Suspense
      fallback={
        <div className="dark-auth bg-background text-text-body font-sans min-h-screen flex transition-colors duration-200">
          <div className="hidden lg:flex flex-1" />
          <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
            <div className="w-full max-w-md vault-glass-panel rounded-xl p-8 md:p-10">
              <div className="text-center text-text-muted">Loading…</div>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
