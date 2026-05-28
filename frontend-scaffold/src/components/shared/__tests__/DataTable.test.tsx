import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from '../DataTable';
import type { DataTableColumn } from '../DataTable';

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
  amount: number;
  date: string;
}

const mockData: TestRow[] = [
  { id: '1', name: 'Alice', amount: 100, date: '2024-01-15' },
  { id: '2', name: 'Bob', amount: 50, date: '2024-01-14' },
  { id: '3', name: 'Charlie', amount: 200, date: '2024-01-13' },
];

const columns: DataTableColumn<TestRow>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'date', label: 'Date' },
];

function setViewport(width: number, _height: number) {
  const matches = width >= 768;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 768px)' ? matches : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe('DataTable', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px)' ? true : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all columns on desktop', () => {
    setViewport(1200, 800);
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('renders table rows with data', () => {
    setViewport(1200, 800);
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('uses card layout on mobile', () => {
    setViewport(375, 812);
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(mockData.length);
  });

  it('shows data in mobile cards', () => {
    setViewport(375, 812);
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );
    const articles = screen.getAllByRole('article');
    expect(articles[0]).toHaveTextContent('Alice');
    expect(articles[0]).toHaveTextContent('100');
  });

  it('sorts by column ascending on first click', async () => {
    setViewport(1200, 800);
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );

    await user.click(screen.getByText('Amount'));

    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1);
    expect(dataRows[0]).toHaveTextContent('Bob');
    expect(dataRows[1]).toHaveTextContent('Alice');
    expect(dataRows[2]).toHaveTextContent('Charlie');
  });

  it('sorts by column descending on second click', async () => {
    setViewport(1200, 800);
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );

    await user.click(screen.getByText('Amount'));
    await user.click(screen.getByText('Amount'));

    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1);
    expect(dataRows[0]).toHaveTextContent('Charlie');
    expect(dataRows[1]).toHaveTextContent('Alice');
    expect(dataRows[2]).toHaveTextContent('Bob');
  });

  it('clears sort on third click', async () => {
    setViewport(1200, 800);
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
      />,
    );

    await user.click(screen.getByText('Amount'));
    await user.click(screen.getByText('Amount'));
    await user.click(screen.getByText('Amount'));

    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1);
    expect(dataRows[0]).toHaveTextContent('Alice');
    expect(dataRows[1]).toHaveTextContent('Bob');
    expect(dataRows[2]).toHaveTextContent('Charlie');
  });

  it('toggles column visibility', async () => {
    setViewport(1200, 800);
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row: TestRow) => row.id}
      />,
    );

    await user.click(screen.getByLabelText('Toggle column visibility'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);

    await user.click(checkboxes[2]);

    expect(screen.queryByRole('columnheader', { name: /date/i })).not.toBeInTheDocument();
  });

  it('renders empty state', () => {
    setViewport(1200, 800);
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
        emptyMessage="No records found"
      />,
    );
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders pagination when provided', () => {
    setViewport(1200, 800);
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row) => row.id}
        pagination={{
          currentPage: 1,
          totalPages: 3,
          onPageChange,
        }}
      />,
    );
    expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', async () => {
    setViewport(1200, 800);
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(row: TestRow) => row.id}
        onRowClick={onRowClick}
      />,
    );

    const rows = screen.getAllByRole('row');
    await user.click(rows[1]);

    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });
});
