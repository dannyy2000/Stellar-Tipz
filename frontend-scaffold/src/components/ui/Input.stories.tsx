import type { Meta, StoryObj } from '@storybook/react-vite';
import Input from '@/components/ui/Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    type: { control: 'select', options: ['text', 'email', 'number', 'password'] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Username', placeholder: '@creator' },
};

export const WithHelperText: Story = {
  args: {
    label: 'Tip Amount',
    placeholder: '5',
    type: 'number',
    helperText: 'Minimum tip is 1 XLM.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Amount',
    placeholder: '5',
    error: 'Amount must be greater than 0.',
    value: '-1',
  },
};

export const Disabled: Story = {
  args: { label: 'Wallet Address', value: 'GABC...XYZ', disabled: true },
};
