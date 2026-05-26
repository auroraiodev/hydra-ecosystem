import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { LoginResponse } from '../../types';
import { tokenStore } from '../../utils/tokenStore';
import { fixUserData } from '../../utils/encoding';

interface AuthState {
  user: LoginResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

/**
 * Async thunk: restore auth state on app load.
 * Reads the token from the httpOnly cookie via /api/auth/session (never localStorage).
 * Restores user profile from localStorage (not sensitive — no secrets there).
 */
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  if (typeof window === 'undefined') return null;

  try {
    const sessionRes = await fetch('/api/auth/session');
    if (!sessionRes.ok) return null;

    const { token } = await sessionRes.json();
    if (!token) return null;

    tokenStore.set(token);

    const userStr = localStorage.getItem('user:v1') || localStorage.getItem('user');
    if (!userStr) return { token, user: null };

    const userData = JSON.parse(userStr);
    const fixedUser = fixUserData(userData);

    const fixedUserStr = JSON.stringify(fixedUser);
    if (fixedUserStr !== userStr) {
      localStorage.setItem('user:v1', fixedUserStr);
    }

    return { token, user: fixedUser };
  } catch {
    return null;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: LoginResponse['user']; token: string }>
    ) => {
      const fixedUser = fixUserData(action.payload.user);

      state.user = fixedUser;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Token goes to in-memory store only — never localStorage
      tokenStore.set(action.payload.token);

      // User profile data is not sensitive — keep in localStorage for UX
      if (typeof window !== 'undefined') {
        localStorage.setItem('user:v1', JSON.stringify(fixedUser));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      tokenStore.clear();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('user:v1');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
      }
      // httpOnly __sid cookie is cleared by the /api/auth/logout route
      // (called separately by the logout handler in hooks/useAuth.ts)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = !!action.payload.user && !!action.payload.token;
        }
        state.isLoading = false;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
