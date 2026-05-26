import { ErrorBoundary } from '@/features/shared';
import { ActiveCategoriesProvider } from '@/features/products/contexts/ActiveCategoriesContext';
import { MarketplaceNavigation, MarketplaceContentWrapper } from '@/features/navigation';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveCategoriesProvider>
      <div className="flex flex-col min-h-screen bg-vault-bg overflow-x-hidden">
        {/* Marketplace Content */}
        <MarketplaceContentWrapper>
          <ErrorBoundary>{children}</ErrorBoundary>
        </MarketplaceContentWrapper>

        <MarketplaceNavigation />
      </div>
    </ActiveCategoriesProvider>
  );
}
