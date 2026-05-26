import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-only container. Hidden on lg+ breakpoint.
 * BottomNavigation is rendered once in the marketplace layout — do not add it here.
 */
export const MobilePageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div
      className={`lg:hidden bg-vault-bg font-display text-vault-text min-h-screen pb-40 antialiased selection:bg-teal/20 selection:text-teal ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Desktop-only container. Hidden below lg breakpoint.
 */
export const DesktopPageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div
      className={`hidden lg:block bg-vault-bg min-h-screen text-vault-text max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
};
