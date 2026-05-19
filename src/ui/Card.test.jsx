import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card.jsx';

describe('Card', () => {
  it('renders children inside a div', () => {
    render(<Card>hello</Card>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies default variant (sm shadow) and md padding', () => {
    const { container } = render(<Card>x</Card>);
    const el = container.firstChild;
    expect(el).toHaveClass('shadow-sm');
    expect(el).toHaveClass('p-4');
    expect(el).toHaveClass('bg-surface');
    expect(el).toHaveClass('rounded-xl');
    expect(el).toHaveClass('border');
  });

  it('applies elevated variant (lg shadow)', () => {
    const { container } = render(<Card variant="elevated">x</Card>);
    expect(container.firstChild).toHaveClass('shadow-lg');
  });

  it('applies flat variant (no shadow class)', () => {
    const { container } = render(<Card variant="flat">x</Card>);
    const el = container.firstChild;
    expect(el).not.toHaveClass('shadow-sm');
    expect(el).not.toHaveClass('shadow-lg');
  });

  it.each([
    ['none', null],
    ['sm', 'p-3'],
    ['md', 'p-4'],
    ['lg', 'p-5'],
  ])('applies padding=%s correctly', (pad, expected) => {
    const { container } = render(<Card padding={pad}>x</Card>);
    if (expected) {
      expect(container.firstChild).toHaveClass(expected);
    } else {
      // none -> no p-* class
      expect(container.firstChild.className).not.toMatch(/(?:^|\s)p-\d/);
    }
  });

  it('merges consumer className', () => {
    const { container } = render(<Card className="extra">x</Card>);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('forwards arbitrary props', () => {
    const { container } = render(<Card data-foo="bar">x</Card>);
    expect(container.firstChild).toHaveAttribute('data-foo', 'bar');
  });
});
