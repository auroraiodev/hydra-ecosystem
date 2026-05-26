export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    phone?: string | null;
    role: {
      id: string;
      name: string;
      display_name: string;
    };
  };
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface SignupResponse {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  roles: {
    id: string;
    name: string;
    display_name: string;
  };
}
