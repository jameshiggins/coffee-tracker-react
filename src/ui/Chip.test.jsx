import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Chip from './Chip.jsx';

describe('Chip', () => {
  it('renders as a <span> when no onClick', () => {
    render(<Chip>Ethiopia</Chip>);
    const node = screen.getByText('Ethiopia').closest('span,button');
    expect(node.tagName).toBe('SPAN');
    // No focus ring class when non-interactive
    expect(node.className).not.toMatch(/focus-visible:ring/);
  });

  it('renders as a <button> when onClick provided and fires it', () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Filter</Chip>);
    const btn = screen.getByRole('button', { name: 'Filter' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['amber',   'bg-amber-50'],
    ['emerald', 'bg-emerald-50'],
    ['cyan',    'bg-cyan-50'],
    ['sky',     'bg-sky-50'],
    ['stone',   'bg-stone-50'],
    ['yellow',  'bg-yellow-50'],
    ['orange',  'bg-orange-50'],
    ['red',     'bg-red-50'],
    ['accent',  'text-accent'],
    ['neutral', 'text-fg-muted'],
  ])('applies tone %s', (tone, expectedClass) => {
    const { container } = render(<Chip tone={tone}>x</Chip>);
    expect(container.firstChild).toHaveClass(expectedClass);
  });

  it.each([
    ['xs', 'text-xs'],
    ['sm', 'text-sm'],
    ['md', 'text-sm'],
  ])('applies size %s', (size, cls) => {
    const { container } = render(<Chip size={size}>x</Chip>);
    expect(container.firstChild).toHaveClass(cls);
  });

  it('renders an optional count', () => {
    render(<Chip count={12}>Roasters</Chip>);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('omits count when not provided (no stray 0/empty)', () => {
    const { container } = render(<Chip>Roasters</Chip>);
    expect(container.firstChild.children.length).toBe(1);
  });

  it('includes focus-visible ring when interactive', () => {
    render(<Chip onClick={() => {}}>x</Chip>);
    expect(screen.getByRole('button').className).toMatch(/focus-visible:ring/);
  });

  it('merges consumer className', () => {
    const { container } = render(<Chip className="custom">x</Chip>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards arbitrary props (e.g. data-no-expand)', () => {
    const { container } = render(<Chip data-no-expand>x</Chip>);
    expect(container.firstChild).toHaveAttribute('data-no-expand');
  });
});
