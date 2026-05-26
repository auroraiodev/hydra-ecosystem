import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import WalletPage from '@/app/(dashboard)/dashboard/wallet/page';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_USERS = [
  {
    id: 'user-1',
    name: 'Ana García',
    email: 'ana@example.com',
    balance: 1250.5,
    transactionCount: 8,
  },
  { id: 'user-2', name: 'Luis Pérez', email: 'luis@example.com', balance: 0, transactionCount: 2 },
];

const MOCK_WALLET_DETAIL = {
  id: 'user-1',
  name: 'Ana García',
  email: 'ana@example.com',
  balance: 1250.5,
  transactions: [
    {
      id: 'tx-1',
      amount: 500,
      type: 'SALE_PROCEEDS',
      description: 'Venta de Lightning Bolt (x1)',
      created_at: '2026-03-29T20:46:00Z',
    },
    {
      id: 'tx-2',
      amount: -200,
      type: 'WITHDRAWAL',
      description: 'Retiro de efectivo',
      created_at: '2026-03-28T10:00:00Z',
    },
    {
      id: 'tx-3',
      amount: 50,
      type: 'ADJUSTMENT',
      description: 'Ajuste por devolución',
      created_at: '2026-03-27T12:00:00Z',
    },
  ],
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard/wallet',
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/components/ui/page-header', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('@/components/ui/page-layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Override just the /api/auth/session handler to return the given user id */
function mockSessionUser(id: string) {
  const prevImpl = vi.mocked(fetch).getMockImplementation();
  vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
    const urlStr = url.toString();
    if (urlStr.includes('/api/auth/session')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            authenticated: true,
            user: { id, email: 'admin@example.com', role: 'ADMIN' },
          }),
          { status: 200 },
        ),
      );
    }
    return prevImpl ? prevImpl(url) : Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  });
}

function mockSessionAuth(id: string | null) {
  if (id) {
    vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/auth/session')) {
        return Promise.resolve(
          new Response(JSON.stringify({ authenticated: true, user: { id, email: 'admin@example.com', role: 'ADMIN' } }), { status: 200 })
        );
      }
      // Fall through to default mock
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });
  }
}

function mockFetch(usersPayload = MOCK_USERS, detailPayload = MOCK_WALLET_DETAIL) {
  vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
    const urlStr = url.toString();
    if (urlStr.includes('/admin/wallet/users') && !urlStr.match(/\/users\/[^/]+$/)) {
      return Promise.resolve(new Response(JSON.stringify({ data: usersPayload }), { status: 200 }));
    }
    if (urlStr.match(/\/admin\/wallet\/users\//)) {
      return Promise.resolve(
        new Response(JSON.stringify({ data: detailPayload }), { status: 200 })
      );
    }
    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  });
}

// ─── WalletPage tests ─────────────────────────────────────────────────────────

describe('WalletPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionAuth('admin-id');
    mockFetch();
  });

  it('shows loading skeletons initially', () => {
    render(<WalletPage />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders user list with names after load', async () => {
    render(<WalletPage />);
    await waitFor(() => {
      expect(screen.getByText('Ana García')).toBeInTheDocument();
      expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
    });
  });

  it('renders balance in MXN format', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    // Balance appears multiple times (KPI card + row), all should have MXN format
    const balanceCells = screen.getAllByText(/1,250/);
    expect(balanceCells.length).toBeGreaterThan(0);
  });

  it('shows summary KPI cards', async () => {
    render(<WalletPage />);
    await waitFor(() => {
      expect(screen.getByText('Usuarios con saldo')).toBeInTheDocument();
      expect(screen.getByText('Saldo total en circulación')).toBeInTheDocument();
      expect(screen.getByText('Saldo promedio')).toBeInTheDocument();
    });
  });

  it('filters users by name search', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), {
      target: { value: 'luis' },
    });

    expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
  });

  it('filters users by email search', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), {
      target: { value: 'ana@example' },
    });

    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.queryByText('Luis Pérez')).not.toBeInTheDocument();
  });

  it('opens wallet detail dialog on user row click', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));

    await waitFor(() => {
      expect(screen.getByText('Saldo Actual')).toBeInTheDocument();
    });
  });

  it('shows transaction history in the detail dialog', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));

    await waitFor(() => {
      expect(screen.getByText(/Venta de Lightning Bolt/)).toBeInTheDocument();
      expect(screen.getByText(/Retiro de efectivo/)).toBeInTheDocument();
      expect(screen.getByText(/Ajuste por devolución/)).toBeInTheDocument();
    });
  });

  it('shows "Ajustar saldo" button when viewing another user', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));

    await waitFor(() => {
      expect(screen.getByText('Ajustar saldo')).toBeInTheDocument();
    });
  });

  it('hides "Ajustar saldo" and shows "Tu cuenta" when viewing own wallet', async () => {
    mockSessionUser('user-1');
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));

    await waitFor(() => {
      expect(screen.getByText('Tu cuenta')).toBeInTheDocument();
      expect(screen.queryByText('Ajustar saldo')).not.toBeInTheDocument();
    });
  });

  it('shows "no users" message when list is empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    );
    render(<WalletPage />);
    await waitFor(() => {
      expect(screen.getByText(/No hay usuarios con wallet activo/)).toBeInTheDocument();
    });
  });

  it('shows error toast when wallet users fetch fails', async () => {
    const { toast } = await import('sonner');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    render(<WalletPage />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/No se pudieron cargar/i));
    });
  });
});

// ─── Access code dialog tests ─────────────────────────────────────────────────

describe('WalletPage — access code dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/auth/session')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              authenticated: true,
              user: { id: 'admin-id', email: 'admin@example.com', role: 'ADMIN' },
            }),
            { status: 200 },
          ),
        );
      }
      if (urlStr.includes('/admin/wallet/users') && !urlStr.match(/\/users\/[^/]+$/)) {
        return Promise.resolve(new Response(JSON.stringify({ data: MOCK_USERS }), { status: 200 }));
      }
      if (urlStr.match(/\/admin\/wallet\/users\//)) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: MOCK_WALLET_DETAIL }), { status: 200 })
        );
      }
      if (urlStr.includes('/verify-access')) {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });
  });

  it('opens access code dialog when "Ajustar saldo" is clicked', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));
    await waitFor(() => screen.getByText('Ajustar saldo'));
    fireEvent.click(screen.getByText('Ajustar saldo'));

    await waitFor(() => {
      expect(screen.getByText('Verificación de acceso')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Código de acceso')).toBeInTheDocument();
    });
  });

  it('shows error toast on wrong access code (401 response)', async () => {
    const { toast } = await import('sonner');
    vi.mocked(fetch).mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/admin/wallet/users') && !urlStr.match(/\/users\/[^/]+$/)) {
        return Promise.resolve(new Response(JSON.stringify({ data: MOCK_USERS }), { status: 200 }));
      }
      if (urlStr.match(/\/admin\/wallet\/users\//)) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: MOCK_WALLET_DETAIL }), { status: 200 })
        );
      }
      if (urlStr.includes('/verify-access')) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: 'Código incorrecto' }), { status: 401 })
        );
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });

    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));
    await waitFor(() => screen.getByText('Ajustar saldo'));
    fireEvent.click(screen.getByText('Ajustar saldo'));

    await waitFor(() => screen.getByPlaceholderText('Código de acceso'));
    fireEvent.change(screen.getByPlaceholderText('Código de acceso'), {
      target: { value: '0000' },
    });
    fireEvent.click(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Código incorrecto');
    });
  });

  it('"Continuar" button is disabled when code input is empty', async () => {
    render(<WalletPage />);
    await waitFor(() => screen.getByText('Ana García'));
    fireEvent.click(screen.getByText('Ana García'));
    await waitFor(() => screen.getByText('Ajustar saldo'));
    fireEvent.click(screen.getByText('Ajustar saldo'));

    await waitFor(() => screen.getByPlaceholderText('Código de acceso'));
    expect(screen.getByText('Continuar')).toBeDisabled();
  });
});
