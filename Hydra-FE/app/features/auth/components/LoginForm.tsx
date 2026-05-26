'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useLoginForm, useGoogleAuth } from '../hooks';
import { Input, FlowButton, Divider, Link } from '@/features/shared/ui';
import { LOGIN_CONSTANTS } from '../constants';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    handleSubmit,
  } = useLoginForm(redirectTo);
  const { initiateGoogleAuth, isLoading: oauthLoading } = useGoogleAuth();

  return (
    <div className="w-full max-w-md vault-glass-panel rounded-2xl p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative z-10 my-auto">
      {/* Header */}
      <div className="text-center lg:text-left mb-8">
        <h2 className="text-2xl font-semibold text-text-body mb-2">{LOGIN_CONSTANTS.TITLE}</h2>
        <p className="text-text-muted text-sm leading-relaxed">{LOGIN_CONSTANTS.SUBTITLE}</p>
      </div>

      {/* Google Login */}
      <div className="gap-y-4 mb-8">
        <FlowButton
          variant="secondary"
          type="button"
          disabled={isLoading || oauthLoading}
          className="w-full gap-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          onClick={initiateGoogleAuth}
        >
          <svg className="size-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {LOGIN_CONSTANTS.FORM.GOOGLE_BUTTON}
        </FlowButton>

        <Divider text={LOGIN_CONSTANTS.FORM.OR_DIVIDER} />
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="gap-y-5">
        <Input
          id="email"
          label={LOGIN_CONSTANTS.FORM.EMAIL.LABEL}
          type="email"
          placeholder={LOGIN_CONSTANTS.FORM.EMAIL.PLACEHOLDER}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon="email"
          required
          disabled={isLoading}
        />

        <Input
          id="password"
          label={LOGIN_CONSTANTS.FORM.PASSWORD.LABEL}
          type="password"
          placeholder={LOGIN_CONSTANTS.FORM.PASSWORD.PLACEHOLDER}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPasswordToggle
          isPasswordVisible={showPassword}
          onTogglePassword={togglePasswordVisibility}
          required
          disabled={isLoading}
        />

        <div className="flex justify-end">
          <Link
            className="text-sm font-medium text-teal hover:text-teal/80 transition-colors"
            href="#"
          >
            {LOGIN_CONSTANTS.FORM.FORGOT_PASSWORD}
          </Link>
        </div>

        <FlowButton
          type="submit"
          variant="default"
          disabled={isLoading}
          className="w-full bg-teal hover:bg-teal/90 text-white border-0 shadow-[0_4px_20px_rgba(var(--glow-teal-rgb)/0.25)] hover:shadow-[0_6px_30px_rgba(var(--glow-teal-rgb)/0.35)] transition-all duration-300"
        >
          <span className="relative z-[2] font-semibold">
            {isLoading ? LOGIN_CONSTANTS.FORM.SUBMITTING : LOGIN_CONSTANTS.FORM.SUBMIT}
          </span>
        </FlowButton>
      </form>

      {/* Signup Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-text-muted">
          {LOGIN_CONSTANTS.FOOTER.NO_ACCOUNT}{' '}
          <Link variant="primary" href="/signup">
            {LOGIN_CONSTANTS.FOOTER.SIGNUP}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="text-text-muted text-center">Loading…</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
