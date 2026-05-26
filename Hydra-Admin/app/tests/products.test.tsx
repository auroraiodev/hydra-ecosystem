import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProductsContent from '../app/(dashboard)/dashboard/products/products-content';
import AddProductPage from '../app/(dashboard)/dashboard/products/add/page';
import { singlesAPI } from '../lib/api';

// Mock API functions
vi.mock('../../lib/api', () => ({
  singlesAPI: {
    list: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    deleteBulk: vi.fn(),
    changeOwner: vi.fn(),
    updateTags: vi.fn(),
    updateFoil: vi.fn(),
  },
  conditionsAPI: {
    list: vi.fn().mockResolvedValue([]),
  },
  usersAPI: {
    list: vi.fn().mockResolvedValue([]),
  },
  languagesAPI: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Admin Product Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(singlesAPI.list).mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '1',
            name: 'Lightning Bolt',
            expansion: 'Magic',
            categories: { name: 'Magic' },
            price: 49.99,
            stock: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        meta: {
          total: 1,
          totalPages: 1,
        },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(component);
  };

  describe('Product List', () => {
    it('renders products correctly', async () => {
      renderWithProviders(<ProductsContent />);

      await waitFor(() => {
        expect(screen.getByText(/Lightning Bolt/i)).toBeInTheDocument();
        expect(screen.getByText(/Magic/i)).toBeInTheDocument();
        expect(screen.getByText(/\$49.99/)).toBeInTheDocument();
      });
    });

    it('handles search', async () => {
      renderWithProviders(<ProductsContent />);

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'Lightning' } });

      await waitFor(() => {
        expect(vi.mocked(singlesAPI.list)).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'Lightning',
          undefined
        );
      });
    });
  });

  describe('Product Creation', () => {
    it('renders add product page', async () => {
      renderWithProviders(<AddProductPage />);

      await waitFor(() => {
        expect(screen.getByText(/Agregar Productos/i)).toBeInTheDocument();
      });
    });
  });
});
