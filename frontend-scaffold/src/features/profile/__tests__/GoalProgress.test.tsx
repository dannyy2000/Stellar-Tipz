import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockGoals = vi.fn(() => []);
vi.mock('@/store/goalStore', () => ({
  useGoalStore: (selector?: any) => {
    const state = { goals: mockGoals() };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/components/shared/ShareButton', () => ({
  default: ({ 'data-testid': testId }: any) => <div data-testid={testId ?? 'share-btn'} />,
}));

import GoalProgress from '../GoalProgress';
import type { Goal } from '@/types/contract';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    creator: 'GABC123',
    title: 'New Camera',
    description: 'Saving for a camera',
    targetAmount: '10000000',
    raisedAmount: '0',
    supporters: 0,
    startDate: Date.now(),
    endDate: Date.now() + 86400000 * 7,
    active: true,
    completed: false,
    ...overrides,
  };
}

function renderPage(goal?: Goal, creatorAddress?: string) {
  return render(
    <BrowserRouter>
      <GoalProgress goal={goal} creatorAddress={creatorAddress} showShare={false} />
    </BrowserRouter>,
  );
}

describe('GoalProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGoals.mockReturnValue([]);
  });

  it('renders nothing when no goal and no store match', () => {
    const { container } = renderPage();
    expect(container.textContent).toBe('');
  });

  it('renders goal details when goal prop is passed', () => {
    const goal = makeGoal();
    renderPage(goal);
    expect(screen.getByText('NEW CAMERA')).toBeInTheDocument();
    expect(screen.getByText('Saving for a camera')).toBeInTheDocument();
  });

  it('renders goal from store when creatorAddress is provided', () => {
    const goal = makeGoal();
    mockGoals.mockReturnValue([goal]);
    const { container } = render(<BrowserRouter><GoalProgress creatorAddress="GABC123" showShare={false} /></BrowserRouter>);
    expect(screen.getByText('NEW CAMERA')).toBeInTheDocument();
  });

  it('shows correct percentage in progressbar', () => {
    const goal = makeGoal({ raisedAmount: '2500000' });
    renderPage(goal);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '25');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows Goal reached! when completed', () => {
    const goal = makeGoal({ completed: true });
    renderPage(goal);
    expect(screen.getByText('Goal reached!')).toBeInTheDocument();
  });

  it('shows Goal reached! when 100% funded', () => {
    const goal = makeGoal({ raisedAmount: '10000000' });
    renderPage(goal);
    expect(screen.getByText('Goal reached!')).toBeInTheDocument();
  });

  it('shows supporter count', () => {
    const goal = makeGoal({ supporters: 5 });
    renderPage(goal);
    expect(screen.getByText('5 supporters')).toBeInTheDocument();
  });

  it('shows singular supporter', () => {
    const goal = makeGoal({ supporters: 1 });
    renderPage(goal);
    expect(screen.getByText('1 supporter')).toBeInTheDocument();
  });

  it('shows time left', () => {
    const goal = makeGoal({ endDate: Date.now() + 86400000 * 3 });
    renderPage(goal);
    expect(screen.getByText(/d h left/)).toBeInTheDocument();
  });

  it('shows Ended when past end date', () => {
    const goal = makeGoal({ endDate: Date.now() - 1000 });
    renderPage(goal);
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('shows XLM amounts', () => {
    const goal = makeGoal({ raisedAmount: '1000000', targetAmount: '10000000' });
    renderPage(goal);
    expect(screen.getByText('0.1 XLM')).toBeInTheDocument();
    expect(screen.getByText('of 1 XLM')).toBeInTheDocument();
  });
});
