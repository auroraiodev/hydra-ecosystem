import { API_URL } from '@/lib/constants/api';
import type { SignupRequest, SignupResponse } from '../types';

// @knip-ignore - unused export kept for reference
// export async function login(credentials: LoginRequest): Promise<LoginResponse> {
//   try {
//     const response = await fetch(`${API_URL}/auth/login`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//     });
//
//     if (!response.ok) {
//       const errorData = await response.json().catch((err) => {
//         console.error('[auth/login] JSON parse error:', err);
//         return {};
//       });
//       throw new Error(errorData.message || 'Credenciales inválidas');
//     }
//
//     return response.json();
//   } catch (error) {
//     if (error instanceof TypeError && error.message.includes('fetch')) {
//       throw new Error(
//         `No se puede conectar al backend en ${API_URL}. Por favor asegúrate de que el backend esté ejecutándose.`
//       );
//     }
//     throw error;
//   }
// }

export async function signup(userData: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_URL}/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch((err) => {
      console.error('[auth/signup] JSON parse error:', err);
      return {};
    });
    throw new Error(errorData.message || 'Error al crear la cuenta');
  }

  return response.json();
}
