export interface UserWithRole {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  store_name?: string | null;
  rfc?: string | null;
  store_logo_url?: string | null;
  is_hydra_alias: boolean;
  role: {
    id: string;
    name: string;
    display_name: string;
  };
}
