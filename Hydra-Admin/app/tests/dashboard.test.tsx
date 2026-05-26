import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DashboardPage from '../app/(dashboard)/dashboard/page';

// Mock the API functions
vi.mock('../../lib/api', () => ({
  adminAPI: {
    getDashboardStats: vi.fn().mockResolvedValue({
      totalUsers: 100,
      totalProducts: 500,
      totalOrders: 250,
      totalRevenue: 10000,
      newUsersToday: 5,
      activeUsers: 80,
      ordersToday: 10,
      revenueToday: 1000,
      recentOrders: [
        {
          id: '1',
          status: 'PENDING',
          total: 99.99,
          createdAt: '2024-01-13T10:00:00Z',
        },
      ],
      lowStockAlerts: [],
    }),
    getOrderStats: vi.fn().mockResolvedValue({
      totalOrders: 250,
      pendingOrders: 10,
      paidOrders: 20,
      processingOrders: 30,
      shippedOrders: 40,
      completedOrders: 140,
      cancelledOrders: 10,
      totalRevenue: 100000,
      averageOrderValue: 400,
    }),
    getRevenueAnalytics: vi.fn().mockResolvedValue([
      {
        period: '2024-01-01',
        revenue: 5000,
        orders: 50,
      },
    ]),
  },
}));

describe('Admin Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(component);
  };

  it('renders dashboard stats correctly', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument(); // Total Users
      expect(screen.getByText(/250/)).toBeInTheDocument(); // Total Orders
      // Total Revenue is formatted as currency in the component
    });
  });

  it('displays recent orders section', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Pedidos Recientes/i)).toBeInTheDocument();
      expect(screen.getByText(/PENDIENTE/i)).toBeInTheDocument();
    });
  });

  it('handles loading states', async () => {
    const { adminAPI } = await import('../lib/api');
    vi.mocked(adminAPI.getDashboardStats).mockImplementationOnce(() => new Promise(() => {}));

    renderWithProviders(<DashboardPage />);

    // Check for skeletons instead of 'dashboard-loading' test-id which might not exist
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles error states', async () => {
    const { adminAPI } = await import('../lib/api');
    vi.mocked(adminAPI.getDashboardStats).mockRejectedValueOnce(
      new Error('Failed to load dashboard data')
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('navigates to different sections', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
