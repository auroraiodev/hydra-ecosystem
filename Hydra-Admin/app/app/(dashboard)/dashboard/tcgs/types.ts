export interface Tcg {
  id: string;
  name: string;
  display_name: string;
  logo_url?: string;
  icon_url?: string;
  loader_url?: string;
  is_active: boolean;
  order: number;
  created_at?: string;
  _count?: { singles: number; categories: number };
}

export const emptyForm = () => ({
  name: '',
  display_name: '',
  logo_url: '',
  icon_url: '',
  loader_url: '',
  is_active: true,
  order: 0,
});
