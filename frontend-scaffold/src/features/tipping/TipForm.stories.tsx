import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import type { Profile } from '@/types/contract';

// Inline a self-contained version of TipForm for Storybook to avoid
// wallet-kit instantiation issues in a browser-only environment.
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { HeartHandshake, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface TipFormPreviewProps {
  creator: Profile;
  onSubmit: (amount: string, message: string) => void;
  isSubmitting?: boolean;
  walletConnected?: boolean;
}

const TipFormPreview: React.FC<TipFormPreviewProps> = ({
  creator,
  onSubmit,
  isSubmitting = false,
  walletConnected = true,
}) => {
  const [amount, setAmount] = useState('5');
  const [message, setMessage] = useState('');
  const presets = [1, 5, 10, 25, 50];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(amount, message);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <Input
        label="Amount (XLM)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="5"
      />
      <div className="flex gap-2 flex-wrap">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={`px-3 py-1.5 border-2 border-black text-sm font-bold transition-all ${
              amount === String(p) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {p} XLM
          </button>
        ))}
      </div>
      <Input
        label="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Keep up the great work!"
      />
      {walletConnected ? (
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!amount || Number(amount) <= 0}
          icon={<HeartHandshake size={18} />}
          iconRight={<ArrowRight size={18} />}
        >
          Send {amount || '0'} XLM to @{creator.username}
        </Button>
      ) : (
        <Button type="button">Connect wallet to tip</Button>
      )}
    </form>
  );
};

const mockCreator: Profile = {
  owner: 'GABC1234DEFG5678HIJK9012LMNO3456PQRS7890TUVW1234XYZA5678BCDE',
  username: 'creator',
  displayName: 'Creator Name',
  bio: 'Building on Stellar.',
  imageUrl: '',
  xHandle: 'creator',
  xFollowers: 5000,
  xEngagementAvg: 3.5,
  creditScore: 750,
  totalTipsReceived: '1250.00',
  totalTipsCount: 42,
  balance: '100.00',
  registeredAt: Date.now(),
  updatedAt: Date.now(),
};

const meta = {
  title: 'Composite/TipForm',
  component: TipFormPreview,
  tags: ['autodocs'],
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  argTypes: {
    isSubmitting: { control: 'boolean' },
    walletConnected: { control: 'boolean' },
  },
  args: {
    creator: mockCreator,
    onSubmit: fn(),
  },
} satisfies Meta<typeof TipFormPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WalletConnected: Story = {
  args: { walletConnected: true, isSubmitting: false },
};

export const WalletDisconnected: Story = {
  args: { walletConnected: false },
};

export const Submitting: Story = {
  args: { walletConnected: true, isSubmitting: true },
};
