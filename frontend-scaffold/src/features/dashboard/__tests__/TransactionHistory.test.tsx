import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '../TransactionHistory';
import { useWalletStore } from '@/store/walletStore';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';

vi.mock('@/store/walletStore');
vi.mock('@/hooks/useTransactionHistory');
vi.mock('@/components/shared/WalletConnect', () => ({
  default: () => <button>Connect Wallet</button>,
}));
vi.mock('@/components/shared/ErrorState', () => ({
  default: ({ title }: { title?: string }) => <div>{title || 'Error'}</div>,
}));

const mockTransactions = [
  {
    id: '1',
    type: 'received' as const,
    amount: '100000000',
    counterparty: 'GABC1234567890EXAMPLE11111111111111111111111',
    date: Math.floor(Date.now() / 1000) - 3600,
    message: 'Great content!',
    txHash: 'tx123',
  },
  {
    id: '2',
    type: 'sent' as const,
    amount: '50000000',
    counterparty: 'GDEF1234567890EXAMPLE22222222222222222222222',
    date: Math.floor(Date.now() / 1000) - 7200,
    message: 'Keep building!',
    txHash: 'tx456',
  },
  {
    id: '3',
    type: 'withdrawal' as const,
    amount: '200000000',
    counterparty: '',
    date: Math.floor(Date.now() / 1000) - 10800,
    message: '',
    txHash: 'tx789',
    fee: '4000000',
    net: '196000000',
  },
];

describe('TransactionHistory', () => {
  beforeEach(() => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: true,
      publicKey: 'GOWNER1234567890EXAMPLE00000000000000000000000',
      network: 'TESTNET',
      connecting: false,
      isReconnecting: false,
      error: null,
      walletError: null,
      walletType: null,
      signingStatus: 'idle',
      connect: vi.fn(),
      disconnect: vi.fn(),
      setConnecting: vi.fn(),
      setReconnecting: vi.fn(),
      setError: vi.fn(),
      setWalletError: vi.fn(),
      setNetwork: vi.fn(),
      setSigningStatus: vi.fn(),
    } as ReturnType<typeof useWalletStore>);

    vi.mocked(useTransactionHistory).mockReturnValue({
      filtered: mockTransactions,
      transactions: mockTransactions,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetch: vi.fn(),
      totalCount: mockTransactions.length,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('renders the page header', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Your complete history of tips, sends, and withdrawals.')).toBeInTheDocument();
  });

  it('renders tab filters', () => {
    render(<TransactionHistory />);
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sent' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Received' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Withdrawals' })).toBeInTheDocument();
  });

  it('renders date range filter inputs', () => {
    render(<TransactionHistory />);
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('renders the data table with columns', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getAllByText('From').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('displays transaction data', () => {
    render(<TransactionHistory />);
    expect(screen.getByText(/Great content/)).toBeInTheDocument();
    expect(screen.getByText(/Keep building/)).toBeInTheDocument();
  });

  it('shows result count', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('3 transactions')).toBeInTheDocument();
  });

  it('switches tabs', async () => {
    const user = userEvent.setup();
    render(<TransactionHistory />);

    await user.click(screen.getByRole('tab', { name: 'Sent' }));

    expect(screen.getByRole('tab', { name: 'Sent' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('TransactionHistory (disconnected)', () => {
  beforeEach(() => {
    vi.mocked(useWalletStore).mockReturnValue({
      connected: false,
      publicKey: null,
      network: 'TESTNET',
      connecting: false,
      isReconnecting: false,
      error: null,
      walletError: null,
      walletType: null,
      signingStatus: 'idle',
      connect: vi.fn(),
      disconnect: vi.fn(),
      setConnecting: vi.fn(),
      setReconnecting: vi.fn(),
      setError: vi.fn(),
      setWalletError: vi.fn(),
      setNetwork: vi.fn(),
      setSigningStatus: vi.fn(),
    } as ReturnType<typeof useWalletStore>);
  });

  it('shows connect wallet message when disconnected', () => {
    render(<TransactionHistory />);
    expect(screen.getByText('Connect your wallet')).toBeInTheDocument();
  });
});
