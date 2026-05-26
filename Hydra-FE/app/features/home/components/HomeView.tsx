import { getApprovedReviews } from '@/lib/api/reviews';
import { getActiveTCGs } from '@/lib/api';
import { HomeSEOContent } from '@/features/shared/components/HomeSEOContent';
import { HeroSection } from '@/features/landing/components';
import { HeroCarouselClient } from './HeroCarouselClient';
import { FaqSection } from './FaqSection';

export async function HomeView() {
  const [reviews, tcgs] = await Promise.all([
    getApprovedReviews().catch(() => []),
    getActiveTCGs().catch(() => []),
  ]);

  return (
    <div className="animate-page-enter">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12 relative z-20">
        <HeroCarouselClient tcgId="global" />
      </div>

      <FaqSection />
      <div className="bg-vault-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeSEOContent reviews={reviews} activeTcgs={tcgs} />
        </div>
      </div>
    </div>
  );
}
