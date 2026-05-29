import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSetGoal = vi.fn();
vi.mock('@/store/goalStore', () => ({
  useGoalStore: (selector?: any) => {
    const state = { setGoal: mockSetGoal };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/components/ui/Button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

import SetGoalForm from '../SetGoalForm';

const onClose = vi.fn();

function renderForm(existingGoal?: any) {
  return render(
    <SetGoalForm creatorAddress="GABC123" existingGoal={existingGoal} onClose={onClose} />,
  );
}

describe('SetGoalForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Set a Fundraising Goal heading for new goal', () => {
    renderForm();
    expect(screen.getByText('Set a Fundraising Goal')).toBeInTheDocument();
  });

  it('shows Edit Goal heading for existing goal', () => {
    renderForm({ title: 'Old', targetAmount: '10000000', endDate: Date.now() + 86400000 });
    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
  });

  it('shows error when title is empty', () => {
    renderForm();
    const btn = screen.getByText('Start Goal');
    fireEvent.click(btn);
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(mockSetGoal).not.toHaveBeenCalled();
  });

  it('shows error when target amount is empty', () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText('e.g. New camera lens'), {
      target: { value: 'My Goal' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByText('Start Goal'));
    expect(screen.getByText('Target amount must be greater than 0')).toBeInTheDocument();
  });

  it('shows error when end date is empty', () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText('e.g. New camera lens'), {
      target: { value: 'My Goal' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByText('Start Goal'));
    expect(screen.getByText('End date is required')).toBeInTheDocument();
  });

  it('shows error when end date is in the past', () => {
    const { container } = renderForm();
    fireEvent.change(screen.getByPlaceholderText('e.g. New camera lens'), {
      target: { value: 'My Goal' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), {
      target: { value: '100' },
    });
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dateInput = container.querySelector('input[type="date"]')!;
    fireEvent.change(dateInput, { target: { value: yesterday } });
    fireEvent.click(screen.getByText('Start Goal'));
    expect(screen.getByText('End date must be in the future')).toBeInTheDocument();
  });

  it('creates goal on valid submission', () => {
    const { container } = renderForm();
    fireEvent.change(screen.getByPlaceholderText('e.g. New camera lens'), {
      target: { value: 'My Goal' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 500'), {
      target: { value: '100' },
    });
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
    const dateInput = container.querySelector('input[type="date"]')!;
    fireEvent.change(dateInput, { target: { value: futureDate } });
    fireEvent.click(screen.getByText('Start Goal'));
    expect(mockSetGoal).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
