import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockNotifications = vi.fn(() => []);
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockClearAll = vi.fn();

vi.mock('@/store/notificationStore', () => ({
  useNotificationStore: (selector?: any) => {
    const state = {
      notifications: mockNotifications(),
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      clearAll: mockClearAll,
    };
    return selector ? selector(state) : state;
  },
}));

import NotificationCenter from '../NotificationCenter';

const onClose = vi.fn();

function renderPage() {
  return render(
    <BrowserRouter>
      <NotificationCenter onClose={onClose} />
    </BrowserRouter>,
  );
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications.mockReturnValue([]);
  });

  it('shows empty state when no notifications', () => {
    renderPage();
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('renders notification list', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'New Tip', message: 'You received 10 XLM', timestamp: Date.now(), unread: true },
      { id: '2', type: 'system', title: 'Welcome', message: 'Welcome to Tipz', timestamp: Date.now(), unread: false },
    ]);
    renderPage();
    expect(screen.getByText('New Tip')).toBeInTheDocument();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // unread count badge
  });

  it('shows Mark all read button when unread exists', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'New Tip', message: '', timestamp: Date.now(), unread: true },
    ]);
    renderPage();
    expect(screen.getByText('Mark all read')).toBeInTheDocument();
  });

  it('calls markAllAsRead when button clicked', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'New Tip', message: '', timestamp: Date.now(), unread: true },
    ]);
    renderPage();
    fireEvent.click(screen.getByText('Mark all read'));
    expect(mockMarkAllAsRead).toHaveBeenCalledOnce();
  });

  it('calls clearAll when button clicked', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'New Tip', message: '', timestamp: Date.now(), unread: true },
    ]);
    renderPage();
    fireEvent.click(screen.getByText('Clear all'));
    expect(mockClearAll).toHaveBeenCalledOnce();
  });

  it('calls markAsRead and navigate when notification with link is clicked', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'New Tip', message: '', timestamp: Date.now(), unread: true, link: '/profile' },
    ]);
    renderPage();
    fireEvent.click(screen.getByText('New Tip'));
    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when notification without link is clicked', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'New Tip', message: '', timestamp: Date.now(), unread: true },
    ]);
    renderPage();
    fireEvent.click(screen.getByText('New Tip'));
    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows notification type icons', () => {
    mockNotifications.mockReturnValue([
      { id: '1', type: 'tip', title: 'Tip', message: '', timestamp: Date.now(), unread: false },
      { id: '2', type: 'achievement', title: 'Achievement', message: '', timestamp: Date.now(), unread: false },
      { id: '3', type: 'system', title: 'System', message: '', timestamp: Date.now(), unread: false },
    ]);
    renderPage();
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('Achievement')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
