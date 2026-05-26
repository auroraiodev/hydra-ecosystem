import { RequestLoggingMiddleware } from './request-logging.middleware.js';

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;

  beforeEach(() => {
    middleware = new RequestLoggingMiddleware();
  });

  // Access the private method via any cast for unit testing
  const sanitize = (m: RequestLoggingMiddleware, query: Record<string, unknown>) =>
    (m as any).sanitizeQuery(query);

  describe('sanitizeQuery', () => {
    it('should redact fields containing "token"', () => {
      const result = sanitize(middleware, { token: 'abc123', page: '1' });
      expect(result.token).toBe('[REDACTED]');
      expect(result.page).toBe('1');
    });

    it('should redact fields containing "password"', () => {
      const result = sanitize(middleware, { password: 'secret', name: 'test' });
      expect(result.password).toBe('[REDACTED]');
      expect(result.name).toBe('test');
    });

    it('should redact fields containing "secret"', () => {
      const result = sanitize(middleware, { client_secret: 'xyz', id: '42' });
      expect(result.client_secret).toBe('[REDACTED]');
      expect(result.id).toBe('42');
    });

    it('should redact fields containing "access_token"', () => {
      const result = sanitize(middleware, { access_token: 'tok', other: 'ok' });
      expect(result.access_token).toBe('[REDACTED]');
      expect(result.other).toBe('ok');
    });

    it('should redact fields containing "refresh_token"', () => {
      const result = sanitize(middleware, { refresh_token: 'ref', q: 'search' });
      expect(result.refresh_token).toBe('[REDACTED]');
      expect(result.q).toBe('search');
    });

    it('should redact fields containing "authorization"', () => {
      const result = sanitize(middleware, { authorization: 'Bearer xyz' });
      expect(result.authorization).toBe('[REDACTED]');
    });

    it('should be case-insensitive when matching sensitive keys', () => {
      const result = sanitize(middleware, { TOKEN: 'abc', Password: 'pass' });
      expect(result.TOKEN).toBe('[REDACTED]');
      expect(result.Password).toBe('[REDACTED]');
    });

    it('should not redact normal query parameters', () => {
      const result = sanitize(middleware, { search: 'pikachu', page: '1', limit: '20' });
      expect(result.search).toBe('pikachu');
      expect(result.page).toBe('1');
      expect(result.limit).toBe('20');
    });

    it('should return an empty object for empty input', () => {
      expect(sanitize(middleware, {})).toEqual({});
    });

    it('should handle partial key matches (e.g. api_key)', () => {
      const result = sanitize(middleware, { api_key: 'k123', category: 'cards' });
      expect(result.api_key).toBe('[REDACTED]');
      expect(result.category).toBe('cards');
    });
  });
});
