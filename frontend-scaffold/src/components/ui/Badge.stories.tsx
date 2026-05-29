import type { Meta, StoryObj } from '@storybook/react-vite';
import Badge from '@/components/ui/Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    tier: { control: 'select', options: ['new', 'bronze', 'silver', 'gold', 'diamond'] },
    score: { control: 'number' },
    pulse: { control: 'boolean' },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = { args: { tier: 'new', score: 0 } };
export const Bronze: Story = { args: { tier: 'bronze', score: 450 } };
export const Silver: Story = { args: { tier: 'silver', score: 750 } };
export const Gold: Story = { args: { tier: 'gold', score: 850 } };
export const Diamond: Story = { args: { tier: 'diamond', score: 980 } };

export const WithPulse: Story = {
  args: { tier: 'gold', score: 850, pulse: true },
};

export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(['new', 'bronze', 'silver', 'gold', 'diamond'] as const).map((tier) => (
        <Badge key={tier} tier={tier} />
      ))}
    </div>
  ),
};
