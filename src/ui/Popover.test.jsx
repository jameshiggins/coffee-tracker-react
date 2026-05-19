import { describe, it, expect, act } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Popover from './Popover.jsx';

function Harness({ defaultOpen = false } = {}) {
  return (
    <Popover defaultOpen={defaultOpen}>
      <Popover.Trigger>?</Popover.Trigger>
      <Popover.Content>
        Helpful context goes here
        <Popover.Close>Got it</Popover.Close>
      </Popover.Content>
    </Popover>
  );
}

describe('Popover', () => {
  it('renders the trigger and keeps the panel closed by default', () => {
    render(<Harness />);
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.queryByText(/Helpful context/)).not.toBeInTheDocument();
  });

  it('opens on trigger click', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('?'));
    expect(screen.getByText(/Helpful context/)).toBeInTheDocument();
  });

  it('closes on explicit Popover.Close click', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText(/Helpful context/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Got it'));
    expect(screen.queryByText(/Helpful context/)).not.toBeInTheDocument();
  });

  it('closes on ESC', async () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText(/Helpful context/)).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText(/Helpful context/)).not.toBeInTheDocument();
  });

  it('renders content with the surface token background', () => {
    render(<Harness defaultOpen />);
    // The content has the popover-style classes applied directly to it.
    const content = screen.getByText(/Helpful context/);
    // walk up to find the element with bg-surface (in case content text is in a child)
    let el = content;
    while (el && el !== document.body && !el.classList?.contains('bg-surface')) {
      el = el.parentElement;
    }
    expect(el).not.toBeNull();
    expect(el).toHaveClass('bg-surface');
  });
});
