import { API_URL } from '../constants/api';
import { store } from '@/lib/store';
import type { LoginResponse } from '../types';

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  receiver_name?: string;
  is_default: boolean;
}

export interface CreateAddressData {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  receiver_name?: string;
  is_default?: boolean;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

function getAuthHeader() {
  const state = store.getState();
  const token = state.auth.token;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getAddresses(): Promise<Address[]> {
  try {
    const response = await fetch(`${API_URL}/users/addresses`, {
      method: 'GET',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('getAddresses failed:', response.status, errorText);

      if (response.status === 401) throw new Error('Unauthorized');
      throw new Error(`Failed to fetch addresses: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
}

export async function addAddress(addressData: CreateAddressData): Promise<Address> {
  const response = await fetch(`${API_URL}/users/addresses`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch((err) => {
      console.error('[users/addAddress] JSON parse error:', err);
      return {};
    });
    throw new Error(errorData.message || 'Failed to add address');
  }

  return response.json();
}


export async function updateProfile(data: UpdateProfileData): Promise<LoginResponse['user']> {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch((err) => {
      console.error('[users/updateProfile] JSON parse error:', err);
      return {};
    });
    throw new Error(errorData.message || 'Failed to update profile');
  }

  return response.json();
}
export async function getProfile(): Promise<LoginResponse['user']> {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}
