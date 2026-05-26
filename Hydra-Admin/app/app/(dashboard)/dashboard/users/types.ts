export interface ApiUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  roles: {
    id: string;
    name: string;
    display_name: string;
  };
  is_active: boolean;
  is_hydra_alias: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  roleId: string;
  status: 'active' | 'inactive';
  is_hydra_alias: boolean;
  joined_at?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
}

export function mapApiUserToUser(apiUser: ApiUser): User {
  const name =
    [apiUser.first_name, apiUser.last_name].filter(Boolean).join(' ') || apiUser.username || 'N/A';
  const role = apiUser.roles.name;
  const status = apiUser.is_active ? 'active' : 'inactive';

  return {
    id: apiUser.id,
    email: apiUser.email,
    name,
    username: apiUser.username,
    role,
    roleId: apiUser.roles.id,
    status,
    is_hydra_alias: apiUser.is_hydra_alias || false,
    joined_at: apiUser.created_at,
  };
}

export const initialFormData = {
  email: '',
  username: '',
  first_name: '',
  last_name: '',
  roleId: '',
  is_hydra_alias: false,
};
