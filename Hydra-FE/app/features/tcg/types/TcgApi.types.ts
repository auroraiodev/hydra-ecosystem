export interface TcgApiResponse {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  logoUrl: string | null;
  iconUrl: string | null;
  cardCount: number;
  primaryColor: string | null;
  isActive: boolean;
  order: number;
}
