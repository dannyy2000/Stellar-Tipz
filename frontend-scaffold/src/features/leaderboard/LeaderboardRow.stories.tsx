import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardRow, { LeaderboardRowSkeleton } from '@/features/leaderboard/LeaderboardRow';
import type { LeaderboardEntry } from '@/types/contract';

const mockEntry: LeaderboardEntry = {
  address: 'GABC1234DEFG5678HIJK9012LMNO3456PQRS7890TUVW1234XYZA5678BCDE',
  username: 'stellar_creator',
  totalTipsReceived: '4250.00',
  creditScore: 850,
};

const meta = {
  title: 'Composite/LeaderboardRow',
  component: LeaderboardRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <table className="w-full border-collapse">
          <tbody>
            <Story />
          </tbody>
        </table>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    rank: { control: 'number', min: 1 },
  },
  args: { entry: mockEntry },
} satisfies Meta<typeof LeaderboardRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rank1: Story = { args: { rank: 1 } };
export const Rank2: Story = { args: { rank: 2 } };
export const Rank10: Story = { args: { rank: 10 } };

export const LowScore: Story = {
  args: {
    rank: 5,
    entry: { ...mockEntry, creditScore: 150, totalTipsReceived: '50.00' },
  },
};

export const Skeleton: Story = {
  render: () => (
    <MemoryRouter>
      <table className="w-full border-collapse">
        <tbody>
          <LeaderboardRowSkeleton />
        </tbody>
      </table>
    </MemoryRouter>
  ),
};

export const MultipleRows: Story = {
  render: () => (
    <MemoryRouter>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="px-4 py-2 text-left text-xs font-black uppercase">#</th>
            <th className="px-4 py-2 text-left text-xs font-black uppercase">Creator</th>
            <th className="px-4 py-2 text-right text-xs font-black uppercase">Tips</th>
            <th className="px-4 py-2 text-left text-xs font-black uppercase">Score</th>
          </tr>
        </thead>
        <tbody>
          {[
            { ...mockEntry, username: 'top_creator', creditScore: 980, totalTipsReceived: '50000.00' },
            { ...mockEntry, username: 'stellar_dev', creditScore: 820, totalTipsReceived: '12000.00', address: 'GXYZ...' },
            { ...mockEntry, username: 'new_creator', creditScore: 200, totalTipsReceived: '100.00', address: 'GAAA...' },
          ].map((entry, i) => (
            <LeaderboardRow key={entry.address} entry={entry} rank={i + 1} />
          ))}
        </tbody>
      </table>
    </MemoryRouter>
  ),
};
