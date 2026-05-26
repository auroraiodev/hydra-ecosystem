/**
 * In-memory token store.
 *
 * The JWT is never written to localStorage or sessionStorage.
 * It lives only in this module-level variable — cleared on page close/refresh.
 * Persistence across refreshes is handled via the httpOnly __sid cookie
 * (set server-side), with restoration through /api/auth/session on init.
 */
let _token: string | null = null;

export const tokenStore = {
  get: (): string | null => _token,
  set: (token: string | null): void => {
    _token = token;
  },
  clear: (): void => {
    _token = null;
  },
};
