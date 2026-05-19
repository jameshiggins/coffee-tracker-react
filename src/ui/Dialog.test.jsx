import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Dialog from './Dialog.jsx';

function Harness({ defaultOpen = false } = {}) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <Dialog.Trigger>Open me</Dialog.Trigger>
      <Dialog.Content title="Hello there">
        <Dialog.Description>Body text</Dialog.Description>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('renders only the trigger when closed', () => {
    render(<Harness />);
    expect(screen.getByText('Open me')).toBeInTheDocument();
    expect(screen.queryByText('Body text')).not.toBeInTheDocument();
  });

  it('opens content on trigger click', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Open me'));
    expect(screen.getByText('Body text')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('exposes role=dialog on the open content', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the close button when title is set', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('closes when the explicit Dialog.Close is clicked', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText('Body text')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Body text')).not.toBeInTheDocument();
  });

  it('closes on ESC', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByText('Body text')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
    });
    expect(screen.queryByText('Body text')).not.toBeInTheDocument();
  });

  it('uses semantic tokens (bg-surface) on the content panel', () => {
    render(<Harness defaultOpen />);
    expect(screen.getByRole('dialog')).toHaveClass('bg-surface');
  });

  it('supports a visually-hidden title', () => {
    render(
      <Dialog defaultOpen>
        <Dialog.Content title="Hidden but accessible" hideTitle>
          <p>body</p>
        </Dialog.Content>
      </Dialog>
    );
    // Title is in the DOM (Radix requires it for a11y) but visually hidden.
    expect(screen.getByText('Hidden but accessible')).toHaveClass('sr-only');
    // No visible close button row when title is hidden? In our impl the
    // close button IS still rendered when title is set, even if hidden.
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
