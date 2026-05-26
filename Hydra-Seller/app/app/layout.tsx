import type React from 'react';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { OAuthHandler } from '@/components/oauth-handler';
import { ModalProvider } from '@/components/providers/modal-context';
import { FluentUIProvider } from '@/components/providers/fluent-provider';
import { AppModals } from '@/components/app-modals';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hydra Seller Dashboard',
  description: 'MTG Card Marketplace Seller Portal',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/cat.png',
    apple: '/cat.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased bg-background">
        <FluentUIProvider>
          <ModalProvider>
            {children}
            <OAuthHandler />
            <AppModals />
            <Toaster />
          </ModalProvider>
        </FluentUIProvider>
      </body>
    </html>
  );
}
