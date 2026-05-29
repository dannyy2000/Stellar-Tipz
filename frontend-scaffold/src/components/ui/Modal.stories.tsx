import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useState } from 'react';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    closeOnBackdropClick: { control: 'boolean' },
  },
  args: { onClose: fn() },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Tip',
    children: <p className="text-gray-700">Send 10 XLM to @creator?</p>,
  },
};

export const WithoutTitle: Story = {
  args: {
    isOpen: true,
    children: <p className="text-gray-700">Custom modal content without a title.</p>,
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Interactive Modal">
          <p className="mb-4 text-gray-700">This modal can be opened and closed.</p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Modal>
      </>
    );
  },
};
