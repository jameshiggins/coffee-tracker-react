import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropdownMenu from './DropdownMenu.jsx';

function Harness({ onSelect = () => {}, defaultOpen = false }) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger>Filter</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>Sort by</DropdownMenu.Label>
        <DropdownMenu.Item onSelect={() => onSelect('price')}>Price</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => onSelect('name')}>Name</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item destructive onSelect={() => onSelect('clear')}>Clear</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('renders the trigger and keeps the menu closed by default', () => {
    render(<Harness />);
    expect(screen.getByText('Filter')).toBeInTheDocument();
    expect(screen.queryByText('Price')).not.toBeInTheDocument();
  });

  it('opens on trigger click', async () => {
    // Radix listens for pointerdown/pointerup, not a synthetic React click —
    // userEvent dispatches the full pointer sequence so the menu actually opens.
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('Filter'));
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('uses role=menu and role=menuitem when open', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(3);
  });

  it('fires onSelect when an item is clicked', () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} defaultOpen />);
    fireEvent.click(screen.getByText('Price'));
    expect(onSelect).toHaveBeenCalledWith('price');
  });

  it('marks destructive items with the danger text class', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText('Clear')).toHaveClass('text-danger');
  });

  it('renders the label using semantic muted text class', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText('Sort by')).toHaveClass('text-fg-subtle');
  });

  it('renders a separator between groups', () => {
    render(<Harness defaultOpen />);
    // Radix gives separator role="separator"
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
