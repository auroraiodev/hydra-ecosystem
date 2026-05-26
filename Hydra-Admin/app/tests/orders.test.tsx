import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrdersContent } from '../app/(dashboard)/dashboard/orders/orders-content';
import { ordersAPI } from '../lib/api';

// Mock the API functions
vi.mock('../../lib/api', () => ({
  ordersAPI: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    deleteBulk: vi.fn(),
    export: vi.fn(),
  },
}));

// Mock useModal hook
vi.mock('@/components/providers/modal-context', () => ({
  useModal: () => ({
    showConfirm: vi.fn(),
    showLoading: vi.fn(),
    hideModal: vi.fn(),
  }),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/orders',
}));

describe('Admin Order Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ordersAPI.list).mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '1',
            order_number: 'ORD-123456',
            status: 'pending',
            total_amount: 99.99,
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            created_at: '2024-01-13T10:00:00Z',
            order_items: [
              {
                product_id: 'p1',
                quantity: 2,
                unit_price: 49.99,
                products: {
                  name: 'Lightning Bolt',
                },
              },
            ],
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

  it('renders orders list correctly', async () => {
    renderWithProviders(<OrdersContent />);

    await waitFor(() => {
      expect(screen.getByText(/ORD-123456/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
      expect(screen.getByText(/\$99.99/)).toBeInTheDocument();
      expect(screen.getByText(/Lightning Bolt/i)).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    renderWithProviders(<OrdersContent />);

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 1/i)).toBeInTheDocument();
    });
  });

  it('displays order filters', async () => {
    renderWithProviders(<OrdersContent />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search by order #, customer or email...')
      ).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('handles loading and error states', async () => {
    // Test error state
    vi.mocked(ordersAPI.list).mockRejectedValueOnce(new Error('Failed to load orders'));

    renderWithProviders(<OrdersContent />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
    });
  });
});
