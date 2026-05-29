import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Profile } from '@/types/contract';

vi.mock('../DashboardContext', () => ({
  useDashboardContext: () => mockContext(),
}));

let mockProfile: Profile | null = null;
const mockContext = vi.fn(() => ({ profile: mockProfile }));

import ProfileCompletion from '../ProfileCompletion';

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    owner: 'GABC123',
    username: 'testuser',
    displayName: '',
    bio: '',
    imageUrl: '',
    xHandle: '',
    xFollowers: 0,
    xEngagementAvg: 0,
    creditScore: 75,
    totalTipsReceived: '0',
    totalTipsCount: 0,
    balance: '0',
    registeredAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <BrowserRouter>
      <ProfileCompletion />
    </BrowserRouter>,
  );
}

describe('ProfileCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('tipz_profile_completion_dismissed');
  });

  afterEach(() => {
    localStorage.removeItem('tipz_profile_completion_dismissed');
  });

  it('renders nothing when profile is null', () => {
    mockProfile = null;
    const { container } = renderPage();
    expect(container.textContent).toBe('');
  });

  it('renders nothing when dismissed', () => {
    localStorage.setItem('tipz_profile_completion_dismissed', 'true');
    mockProfile = buildProfile();
    const { container } = renderPage();
    expect(container.textContent).toBe('');
  });

  it('shows 0% for empty profile', () => {
    mockProfile = buildProfile();
    renderPage();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows 60% for partial profile', () => {
    mockProfile = buildProfile({ displayName: 'Alice', xHandle: 'alice_x', username: 'alice' });
    renderPage();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows 100% and celebration when profile is complete', () => {
    mockProfile = buildProfile({
      displayName: 'Alice',
      bio: 'Hello',
      imageUrl: 'https://example.com/avatar.png',
      xHandle: 'alice_x',
      username: 'alice',
    });
    renderPage();
    expect(screen.getByText('Profile Complete!')).toBeInTheDocument();
  });

  it('renders progressbar with correct aria attributes', () => {
    mockProfile = buildProfile({ displayName: 'Alice', xHandle: 'alice_x', username: 'alice' });
    renderPage();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows checklist items as links for incomplete items', () => {
    mockProfile = buildProfile();
    renderPage();
    expect(screen.getByText('Add display name')).toBeInTheDocument();
    expect(screen.getByText('Write your bio')).toBeInTheDocument();
    expect(screen.getByText('Upload avatar')).toBeInTheDocument();
    expect(screen.getByText('Connect X handle')).toBeInTheDocument();
    expect(screen.getByText('Set username')).toBeInTheDocument();
  });

  it('links incomplete items to /profile/edit', () => {
    mockProfile = buildProfile();
    renderPage();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/profile/edit');
    });
  });

  it('dismisses when X button is clicked', () => {
    mockProfile = buildProfile();
    renderPage();
    expect(screen.getByText('0%')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Dismiss profile completion'));
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(localStorage.getItem('tipz_profile_completion_dismissed')).toBe('true');
  });
});
