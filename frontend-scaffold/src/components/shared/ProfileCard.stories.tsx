import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import ProfileCard from '@/components/shared/ProfileCard';

const meta = {
  title: 'Composite/ProfileCard',
  component: ProfileCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    variant: { control: 'select', options: ['default', 'compact'] },
    creditScore: { control: 'number', min: 0, max: 1000 },
    totalTips: { control: 'text' },
    streak: { control: 'number' },
    bio: { control: 'text' },
  },
  args: {
    handle: 'creator',
    publicKey: 'GABC1234DEFG5678HIJK9012LMNO3456PQRS7890TUVW1234XYZA5678BCDE',
    onTip: fn(),
  },
} satisfies Meta<typeof ProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    bio: 'Building on Stellar. Tips appreciated! 🚀',
    creditScore: 750,
    totalTips: '1250.00',
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    creditScore: 850,
    totalTips: '500.00',
    streak: 7,
  },
};

export const NoBio: Story = {
  args: { variant: 'default', creditScore: 200 },
};

export const DiamondTier: Story = {
  args: {
    variant: 'default',
    bio: 'Top creator on Stellar Tipz.',
    creditScore: 980,
    totalTips: '50000.00',
    streak: 30,
  },
};
