import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button.jsx';

describe('Button', () => {
  it('renders children as a button by default', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
    // Default type is button (not submit) so it doesn't accidentally submit forms.
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('applies the primary variant by default (accent bg)', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
  });

  it.each([
    ['secondary', 'border-accent'],
    ['ghost',     'text-accent'],
    ['danger',    'bg-danger'],
  ])('applies the %s variant', (variant, expectedClass) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });

  it.each([
    ['sm', 'min-h-[32px]'],
    ['md', 'min-h-[44px]'],
    ['lg', 'min-h-[48px]'],
  ])('applies size %s with the right min-height', (size, expectedClass) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as <a> when as="a" and is not given a disabled attribute', () => {
    render(<Button as="a" href="/foo">Link</Button>);
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/foo');
    // <a> can't be disabled — assert we don't set the invalid HTML attr.
    expect(link).not.toHaveAttribute('disabled');
  });

  it('uses aria-disabled on <a> when disabled', () => {
    render(<Button as="a" disabled href="/x">Link</Button>);
    expect(screen.getByRole('link')).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders leftIcon and rightIcon', () => {
    render(
      <Button leftIcon={<span data-testid="li">L</span>} rightIcon={<span data-testid="ri">R</span>}>
        Middle
      </Button>
    );
    expect(screen.getByTestId('li')).toBeInTheDocument();
    expect(screen.getByTestId('ri')).toBeInTheDocument();
  });

  it('renders a spinner and disables when loading', () => {
    render(<Button loading leftIcon={<span data-testid="li" />}>Loading</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    // leftIcon is replaced by the spinner, not rendered alongside.
    expect(screen.queryByTestId('li')).not.toBeInTheDocument();
  });

  it('keeps focus-visible ring class for keyboard a11y', () => {
    render(<Button>x</Button>);
    expect(screen.getByRole('button').className).toMatch(/focus-visible:ring/);
  });

  it('passes through arbitrary props (e.g. data-*)', () => {
    render(<Button data-foo="bar">x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-foo', 'bar');
  });

  it('lets consumer className override / append', () => {
    render(<Button className="custom-class">x</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
