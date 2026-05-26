import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Setup jsdom environment FIRST
if (typeof window === 'undefined') {
  // @ts-ignore - jsdom environment setup for testing
  global.window = {};
  // @ts-ignore - jsdom environment setup for testing
  global.document = global.window;
  // @ts-ignore - jsdom environment setup for testing
  global.navigator = {
    userAgent: 'node.js',
  };
  // @ts-ignore - jsdom environment setup for testing
  global.screen = {};
  // @ts-ignore - jsdom environment setup for testing
  global.getComputedStyle = () => {
    return {
      display: 'none',
      appearance: ['-moz-appearance'],
    };
  };
  // @ts-ignore - jsdom environment setup for testing
  global.URL = class URL {
    constructor(url: string, base?: string) {
      this.href = url;
      this.origin = 'http://localhost';
      this.protocol = 'http:';
      this.host = 'localhost';
      this.hostname = 'localhost';
      this.port = '';
      this.pathname = url.replace(/^https?:\/\/[^/]/, '/');
      this.search = '';
      this.hash = '';
    }
  };
}

// Add vi.mocked if not available (for older Vitest versions)
if (!vi.mocked) {
  vi.mocked = <T>(module: T, options?: { shallow?: boolean }) => {
    // Return a mock version of the module
    return new Proxy(() => {}, {
      get: (_, prop: string) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return () => {};
        return typeof module[prop as keyof T] === 'function' ? vi.fn() : (module as any)[prop];
      },
    }) as unknown as ReturnType<typeof vi.mocked<T>>;
  };
}

// Mock fetch
global.fetch = vi.fn();

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    reload: vi.fn(),
    query: {},
    pathname: '/dashboard',
    asPath: '/dashboard',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}));

// Mock Supabase
vi.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'admin-user-id',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        },
      }),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Mock WebSocket
const MockWebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
})) as any;

MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

global.WebSocket = MockWebSocket;

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
