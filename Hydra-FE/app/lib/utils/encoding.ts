/**
 * Fix UTF-8 mojibake caused by the backend misreading UTF-8 bytes as Latin-1.
 * Example: "Ã³" → "ó"
 */
export function fixEncoding(str: string | null | undefined): string {
  if (!str) return str || '';
  try {
    const mojibakePatterns = ['Ã', 'â€', 'Â'];
    const hasMojibake = mojibakePatterns.some((p) => str.includes(p));

    if (hasMojibake) {
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      const decoded = new TextDecoder('utf-8').decode(bytes);
      // Remove any trailing null characters or weird daggers that sometimes appear
      // during incorrect decoding of smart quotes.
      return decoded.replace(/\u0000/g, '').replace(/†/g, ' ');
    }
    return str;
  } catch {
    return str;
  }
}

/**
 * Apply fixEncoding to user name fields and normalise the avatar URL.
 * Handles camelCase aliases (avatarUrl, picture) from OAuth providers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fixUserData<T extends Record<string, any>>(userData: T): T {
  if (!userData) return userData;
  return {
    ...userData,
    first_name: userData.first_name ? fixEncoding(userData.first_name) : userData.first_name,
    last_name: userData.last_name ? fixEncoding(userData.last_name) : userData.last_name,
    name: userData.name ? fixEncoding(userData.name) : userData.name,
    avatar_url: userData.avatar_url ?? userData.avatarUrl ?? userData.picture ?? null,
  };
}
