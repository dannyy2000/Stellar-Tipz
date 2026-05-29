import type { Meta, StoryObj } from '@storybook/react-vite';
import Card from '@/components/ui/Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: { control: 'select', options: ['sm', 'md', 'lg'] },
    hover: { control: 'boolean' },
    isClickable: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a card with brutalist styling.',
    padding: 'md',
  },
};

export const Hoverable: Story = {
  args: {
    hover: true,
    children: 'Hover over me to see the effect.',
    padding: 'md',
  },
};

export const Clickable: Story = {
  args: {
    isClickable: true,
    children: 'Click me!',
    padding: 'md',
  },
};

export const SmallPadding: Story = {
  args: { padding: 'sm', children: 'Small padding card.' },
};

export const LargePadding: Story = {
  args: { padding: 'lg', children: 'Large padding card.' },
};
