/**
 * Role-based cross-app redirect logic.
 *
 * Access matrix:
 *   ADMIN  → fe, admin, seller
 *   SELLER → fe, seller
 *   CLIENT → fe only
 */

export const APP_URLS = {
  fe: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
  seller: process.env.NEXT_PUBLIC_SELLER_URL || 'http://localhost:3003',
} as const;

export type OriginApp = keyof typeof APP_URLS;

export const ROLE_ALLOWED_APPS: Record<string, OriginApp[]> = {
  ADMIN: ['fe', 'admin', 'seller'],
  SELLER: ['fe', 'seller'],
  CLIENT: ['fe'],
};

export const ROLE_DEFAULT_APP: Record<string, OriginApp> = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CLIENT: 'fe',
};

/**
 * Given a user role and the origin app they tried to access,
 * returns the URL they should be redirected to.
 *
 * If the role can access the origin app → redirect to the origin app.
 * If the role cannot access the origin app → redirect to their default app.
 */
export function getAppUrls(): typeof APP_URLS {
  if (typeof window === 'undefined') {
    return APP_URLS;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.');

  const getEnvUrl = (val: string | undefined, fallback: string): string => {
    if (!val) return fallback;
    if (!isLocal) {
      const isValLocal =
        val.includes('localhost') ||
        val.includes('127.0.0.1') ||
        val.includes('192.168.') ||
        val.includes('10.');
      if (isValLocal) {
        return fallback;
      }
    }
    return val;
  };

  if (isLocal) {
    return {
      fe: getEnvUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL, `${protocol}//${hostname}:3000`),
      admin: getEnvUrl(process.env.NEXT_PUBLIC_ADMIN_URL, `${protocol}//${hostname}:3001`),
      seller: getEnvUrl(process.env.NEXT_PUBLIC_SELLER_URL, `${protocol}//${hostname}:3003`),
    };
  }

  const isQA = hostname.includes('qa.') || hostname.includes('qa-') || hostname.includes('netlify.app');

  if (isQA) {
    return {
      fe: getEnvUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL, `${protocol}//hydra-fe.netlify.app`),
      admin: getEnvUrl(process.env.NEXT_PUBLIC_ADMIN_URL, `${protocol}//hydra-adm.netlify.app`),
      seller: getEnvUrl(process.env.NEXT_PUBLIC_SELLER_URL, `${protocol}//hydra-seller.netlify.app`),
    };
  }

  return {
    fe: getEnvUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL, `${protocol}//hydracollect.com`),
    admin: getEnvUrl(process.env.NEXT_PUBLIC_ADMIN_URL, `${protocol}//admin.hydracollect.com`),
    seller: getEnvUrl(process.env.NEXT_PUBLIC_SELLER_URL, `${protocol}//seller.hydracollect.com`),
  };
}

export function getRedirectUrlForRole(
  role: string,
  originApp: OriginApp,
  redirectPath?: string | null
): string {
  const normalizedRole = role.toUpperCase();
  const allowedApps = ROLE_ALLOWED_APPS[normalizedRole] || ROLE_ALLOWED_APPS.CLIENT;
  const defaultApp = ROLE_DEFAULT_APP[normalizedRole] || 'fe';

  const targetApp = allowedApps.includes(originApp) ? originApp : defaultApp;

  // Crucial fix: If redirecting to the same app we are currently on,
  // return a relative path. This avoids falling back to absolute URL strings
  // which might contain hardcoded ports/localhost when env vars are missing.
  if (targetApp === originApp) {
    if (targetApp === 'fe') {
      return redirectPath && redirectPath.startsWith('/') ? redirectPath : '/';
    }
    return redirectPath && redirectPath.startsWith('/') ? redirectPath : '/dashboard';
  }

  const urls = getAppUrls();
  const baseUrl = urls[targetApp];

  if (targetApp === 'fe') {
    const path = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/';
    return `${baseUrl}${path}`;
  }

  const path = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/dashboard';
  return `${baseUrl}${path}`;
}

/**
 * Determines the origin app from the current hostname or a `from` query param.
 */
export function detectOriginApp(): OriginApp {
  if (typeof window === 'undefined') return 'fe';

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Check for known dev ports
  if (port === '3001') return 'admin';
  if (port === '3003') return 'seller';
  if (port === '3000') return 'fe';

  // Production: check hostname patterns
  if (hostname.includes('admin')) return 'admin';
  if (hostname.includes('seller')) return 'seller';
  return 'fe';
}

/**
 * Check if a role can access a given origin app.
 */
export function canAccessApp(role: string, originApp: OriginApp): boolean {
  const normalizedRole = role.toUpperCase();
  const allowedApps = ROLE_ALLOWED_APPS[normalizedRole] || ROLE_ALLOWED_APPS.CLIENT;
  return allowedApps.includes(originApp);
}
