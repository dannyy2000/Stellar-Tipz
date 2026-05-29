import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockNotifications = vi.fn(() => []);
vi.mock('@/store/notificationStore', () => ({
  useNotificationStore: (selector?: any) => {
    const state = {
      notifications: mockNotifications(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      clearAll: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

import NotificationBell from '../NotificationBell';

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.mockReturnValue([]);
  });

  it('renders bell button with no badge when 0 unread', () => {
    render(<NotificationBell />);
    const btn = screen.getByLabelText('Notifications');
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('aria-label')).toBe('Notifications');
  });

  it('shows badge when unread > 0', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'Tip', message: '', timestamp: Date.now(), unread: true },
    ]);
    render(<NotificationBell />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications (1 unread)')).toBeInTheDocument();
  });

  it('shows 9+ when unread > 9', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: String(i), type: 'tip' as const, title: `Tip ${i}`, message: '', timestamp: Date.now(), unread: true,
    }));
    mockNotifications.mockReturnValue(items);
    render(<NotificationBell />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<NotificationBell />);
    expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('closes dropdown on second click', () => {
    render(<NotificationBell />);
    const btn = screen.getByLabelText('Notifications');
    fireEvent.click(btn);
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText('No notifications yet')).not.toBeInTheDocument();
  });

  it('sets aria-expanded on the button', () => {
    render(<NotificationBell />);
    const btn = screen.getByLabelText('Notifications');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
