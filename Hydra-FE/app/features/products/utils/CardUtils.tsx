import { Star } from 'lucide-react';
import { useId } from 'react';
import type { CardData } from '../types';
import { generateSlug } from '@/lib/utils/slug';

export function getConditionDisplay(condition: string | undefined): string {
  if (!condition) return '';

  const conditionLower = condition.toLowerCase().trim();

  // Map of various condition strings (abbreviations, Spanish, etc.) to full English names
  const conditionMap: Record<string, string> = {
    nm: 'Near Mint',
    'near mint': 'Near Mint',
    'cerca de mint': 'Near Mint',
    sp: 'Lightly Played',
    'lightly played': 'Lightly Played',
    'ligeramente jugada': 'Lightly Played',
    mp: 'Moderately Played',
    'moderately played': 'Moderately Played',
    'moderadamente jugada': 'Moderately Played',
    hp: 'Heavily Played',
    'heavily played': 'Heavily Played',
    'muy jugada': 'Heavily Played',
    dm: 'Damaged',
    damaged: 'Damaged',
    dañada: 'Damaged',
  };

  const fullName = conditionMap[conditionLower];
  if (fullName) {
    return fullName;
  }

  // If name is already in the map as a value, return it properly capitalized
  for (const value of Object.values(conditionMap)) {
    if (value.toLowerCase() === conditionLower) {
      return value;
    }
  }

  // Fallback: capitalize the first letter of each word
  return condition
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function RatingStars({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  const starId = useId();
  if (!rating) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => ({ uid: `${starId}-${i}`, index: i })).map((item) => (
          <span
            key={item.uid}
            className={`text-xs ${item.index < Math.floor(rating) ? 'text-yellow-400' : 'text-text-muted'}`}
          >
            {item.index < Math.floor(rating) ? (
              <Star className="size-3 fill-current" />
            ) : (
              <Star className="size-3" />
            )}
          </span>
        ))}
      </div>
      {reviewCount! > 0 && <span className="text-xs text-text-muted">({reviewCount})</span>}
    </div>
  );
}

// Compute finalHref â€” for importation (non-UUID) products, embed the card name and language
// in the URL so that the backend can do a keyword search (?name=) and the detail page
// can pre-select the correct language variant (?language=).
// Local inventory products (UUID ids) use plain href since they resolve via local DB.
export function computeFinalHref(card: CardData): string | undefined {
  if (!card.href) return undefined;

  const [basePath, existingQuery] = card.href.split('?');
  const pathParts = basePath.split('/');
  const rawId = pathParts.pop() || '';
  const prefix = pathParts.join('/');

  // Extract pure ID if it already contains a slug (e.g. ID-some-slug)
  let id = rawId;
  const uuidMatch = rawId.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    id = uuidMatch[1];
  } else {
    // Try to extract numeric ID (e.g. 12345-some-slug)
    const numericMatch = rawId.match(/^(\d+)/);
    if (numericMatch) {
      id = numericMatch[1];
    }
  }

  const name = card.cardName || card.title;
  if (!name) return card.href;

  const slug = generateSlug(name);
  const newHref = `${prefix}/${id}${slug ? `-${slug}` : ''}`;
  const params = new URLSearchParams(existingQuery || '');

  // For importation (non-UUID) products, embed the name/language in search params
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    params.set('name', name);
    if (card.language) params.set('language', card.language);
    const numericPrice = parseFloat(String(card.price ?? '').replace(/[^0-9.]/g, ''));
    if (!isNaN(numericPrice) && numericPrice > 0) params.set('price', numericPrice.toFixed(2));

    // Add other relevant SEO signals for external items
    if (card.expansion) params.set('expansion', card.expansion);
    if (card.condition) params.set('condition', card.condition);
  }

  const queryStr = params.toString();
  return queryStr ? `${newHref}?${queryStr}` : newHref;
}
