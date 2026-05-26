// jest.setup.cjs - Test setup file for hydra-fe
// This file runs before each test to set up the testing environment

// Import dotenv to load environment variables for tests
require('dotenv').config();

// Mock next/navigation for client-side tests
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      pathname: '',
      query: {},
      asPath: '',
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next/image for SSR compatibility
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt, ...rest } = props;
    return React.createElement('img', {
      src: src || '',
      alt: alt || '',
      ...rest,
    });
  },
}));

// Mock next/headers for edge runtime compatibility
jest.mock('next/headers', () => ({
  headers: () => ({
    get: () => 'test-value',
  }),
}));

// Mock React Server Components for client-only tests
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    // Add any mocks for React Server Components if needed
    // For now, we just return the actual React since we're testing client components
  };
});