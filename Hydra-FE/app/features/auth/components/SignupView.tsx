'use client';

import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/features/shared/ui';
import { SignupForm } from './SignupForm';
import { SIGNUP_CONSTANTS } from '../constants';

export function SignupView() {
  return (
    <div className="dark-auth bg-background text-text-body font-sans min-h-[100dvh] flex transition-colors duration-200 bg-gradient-to-br from-teal/5 via-teal/2 to-transparent overflow-hidden">
      {/* Left Section — Branding (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-transparent relative overflow-hidden">
        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/5 transition-colors text-text-muted z-10"
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
                sizes="180px"
                className="object-contain mx-auto mb-6 drop-shadow-[0_20px_50px_rgba(var(--glow-teal-rgb) / 0.25)] relative z-10 hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight mb-3">
              {SIGNUP_CONSTANTS.BRANDING.TITLE_1}
              <br />
              {SIGNUP_CONSTANTS.BRANDING.TITLE_2}
            </h1>
            <p className="text-text-muted text-sm leading-relaxed">
              {SIGNUP_CONSTANTS.BRANDING.SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Right Section — Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative overflow-y-auto no-scrollbar">
        {/* Mobile back button */}
        <Link
          href="/"
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/5 transition-colors text-text-muted lg:hidden"
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
            sizes="60px"
            className="object-contain"
          />
        </div>

        <SignupForm />
      </div>
    </div>
  );
}
