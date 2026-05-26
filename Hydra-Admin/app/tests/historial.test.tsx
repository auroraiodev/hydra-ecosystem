import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import HistorialPage from '@/app/(dashboard)/dashboard/historial/page';
import { transactionsAPI } from '@/lib/api';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS = [
  {
    id: 'tx-1',
    amount: 500,
    type: 'SALE_PROCEEDS',
    description: 'Venta de Lightning Bolt (x1) (Order #abc)',
    created_at: '2026-03-29T20:46:00Z',
    users: { id: 'u1', email: 'demis@example.com', first_name: 'Demis', last_name: 'Rincón' },
  },
  {
    id: 'tx-2',
    amount: -150,
    type: 'WITHDRAWAL',
    description: 'Retiro de efectivo',
    created_at: '2026-03-28T10:00:00Z',
    users: { id: 'u2', email: 'ana@example.com', first_name: 'Ana', last_name: 'García' },
  },
  {
    id: 'tx-3',
    amount: -80,
    type: 'PURCHASE',
    description: 'Pago con wallet — Order #xyz',
    created_at: '2026-03-27T15:00:00Z',
    users: { id: 'u2', email: 'ana@example.com', first_name: 'Ana', last_name: 'García' },
  },
  {
    id: 'tx-4',
    amount: 200,
    type: 'ORDER_REFUND',
    description: 'Reembolso por orden cancelada',
    created_at: '2026-03-26T09:00:00Z',
    users: { id: 'u3', email: 'luis@example.com', first_name: 'Luis', last_name: 'Pérez' },
  },
  {
    id: 'tx-5',
    amount: 100,
    type: 'ADJUSTMENT',
    description: 'Ajuste manual por admin',
    created_at: '2026-04-02T12:00:00Z',
    users: { id: 'u1', email: 'demis@example.com', first_name: 'Demis', last_name: 'Rincón' },
  },
];

const MOCK_PAGINATION = { page: 1, limit: 25, total: 5, totalPages: 1 };

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard/historial',
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/components/ui/page-header', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/components/ui/page-layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Radix Select doesn't render portals in jsdom — replace with a native <select>
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)} data-testid="type-select">
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchOk(data = MOCK_TRANSACTIONS, pagination = MOCK_PAGINATION) {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ data: { data, pagination } }), { status: 200 })
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HistorialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchOk();
  });

  it('renders the page title', () => {
    render(<HistorialPage />);
    expect(screen.getByText('Historial de Transacciones')).toBeInTheDocument();
  });

  it('shows loading skeletons before data arrives', () => {
    render(<HistorialPage />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders all user names after load', async () => {
    render(<HistorialPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Demis Rincón').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ana García').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Luis Pérez').length).toBeGreaterThan(0);
    });
  });

  it('renders at least one badge for each transaction type', async () => {
    render(<HistorialPage />);
    await waitFor(() => {
      // Mobile + desktop both render, so multiple matches are expected
      expect(screen.getAllByText('Venta').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Retiro').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Compra').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Reembolso').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ajuste').length).toBeGreaterThan(0);
    });
  });

  it('shows total record count from pagination', async () => {
    render(<HistorialPage />);
    await waitFor(() => {
      expect(screen.getByText(/5 registros/)).toBeInTheDocument();
    });
  });

  it('shows KPI cards', async () => {
    render(<HistorialPage />);
    await waitFor(() => {
      expect(screen.getByText('Entradas (página actual)')).toBeInTheDocument();
      expect(screen.getByText('Salidas (página actual)')).toBeInTheDocument();
      expect(screen.getByText('Total de registros')).toBeInTheDocument();
    });
  });

  it('client-side filters by name search', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    fireEvent.change(screen.getByPlaceholderText(/buscar por usuario/i), {
      target: { value: 'luis' },
    });

    expect(screen.getAllByText('Luis Pérez').length).toBeGreaterThan(0);
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });

  it('client-side filters by email', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Ana García'));

    fireEvent.change(screen.getByPlaceholderText(/buscar por usuario/i), {
      target: { value: 'ana@' },
    });

    expect(screen.getAllByText('Ana García').length).toBeGreaterThan(0);
    expect(screen.queryByText('Luis Pérez')).not.toBeInTheDocument();
  });

  it('client-side filters by description', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    fireEvent.change(screen.getByPlaceholderText(/buscar por usuario/i), {
      target: { value: 'Ajuste manual' },
    });

    expect(screen.getAllByText(/Ajuste manual por admin/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });

  it('fetches with type param when selector changes', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    vi.clearAllMocks();
    mockFetchOk([MOCK_TRANSACTIONS[1]], { page: 1, limit: 25, total: 1, totalPages: 1 });

    fireEvent.change(screen.getByTestId('type-select'), {
      target: { value: 'WITHDRAWAL' },
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=WITHDRAWAL'),
        expect.any(Object)
      );
    });
  });

  it('shows empty state when no transactions', async () => {
    mockFetchOk([], { page: 1, limit: 25, total: 0, totalPages: 0 });
    render(<HistorialPage />);
    await waitFor(() => {
      expect(screen.getByText(/No se encontraron transacciones/)).toBeInTheDocument();
    });
  });

  it('shows error toast when fetch fails', async () => {
    const { toast } = await import('sonner');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    render(<HistorialPage />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/historial de transacciones/i)
      );
    });
  });

  it('prev page button is disabled on page 1', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    const prevBtn = screen.getByRole('button', { name: 'Página anterior' });
    expect(prevBtn).toBeDisabled();
  });

  it('next page button is disabled on last page', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    const nextBtn = screen.getByRole('button', { name: 'Página siguiente' });
    expect(nextBtn).toBeDisabled();
  });

  it('next page button is enabled when more pages exist', async () => {
    mockFetchOk(MOCK_TRANSACTIONS, { page: 1, limit: 25, total: 50, totalPages: 2 });
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    const nextBtn = screen.getByRole('button', { name: 'Página siguiente' });
    expect(nextBtn).not.toBeDisabled();
  });

  it('positive amounts have green color class', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Demis Rincón'));

    const greenAmounts = document.querySelectorAll('.text-green-600');
    expect(greenAmounts.length).toBeGreaterThan(0);
  });

  it('negative amounts have red color class', async () => {
    render(<HistorialPage />);
    await waitFor(() => screen.getAllByText('Ana García'));

    const redAmounts = document.querySelectorAll('.text-red-500');
    expect(redAmounts.length).toBeGreaterThan(0);
  });
});
