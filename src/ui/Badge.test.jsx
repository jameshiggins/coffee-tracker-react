import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge.jsx';

describe('Badge', () => {
  it('renders children inside a <span>', () => {
    render(<Badge>verified</Badge>);
    const node = screen.getByText('verified');
    expect(node.tagName).toBe('SPAN');
  });

  it('applies stone tone by default', () => {
    const { container } = render(<Badge>x</Badge>);
    expect(container.firstChild).toHaveClass('bg-stone-50');
  });

  it.each([
    ['red',     'bg-red-50'],
    ['emerald', 'bg-emerald-50'],
    ['success', 'bg-emerald-50'],
    ['warning', 'bg-yellow-50'],
    ['danger',  'bg-red-50'],
    ['info',    'bg-sky-50'],
    ['accent',  'text-accent'],
    ['neutral', 'text-fg-muted'],
  ])('applies tone %s', (tone, expected) => {
    const { container } = render(<Badge tone={tone}>x</Badge>);
    expect(container.firstChild).toHaveClass(expected);
  });

  it('falls back to stone for an unknown tone', () => {
    const { container } = render(<Badge tone="totally-made-up">x</Badge>);
    expect(container.firstChild).toHaveClass('bg-stone-50');
  });

  it('never renders as a button (no interactivity)', () => {
    const { container } = render(<Badge>x</Badge>);
    expect(container.querySelector('button')).toBeNull();
  });

  it('merges consumer className', () => {
    const { container } = render(<Badge className="extra">x</Badge>);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('forwards arbitrary props', () => {
    const { container } = render(<Badge data-foo="bar">x</Badge>);
    expect(container.firstChild).toHaveAttribute('data-foo', 'bar');
  });
});
