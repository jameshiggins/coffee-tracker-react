import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating.jsx';

describe('StarRating', () => {
  it('exposes a labelled slider with the current value', () => {
    render(<StarRating value={3.5} onChange={() => {}} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '3.5');
    expect(slider).toHaveAttribute('aria-valuemax', '5');
    expect(slider).toHaveAttribute('aria-valuetext', '3.5 of 5 stars');
  });

  it('reports "No rating" at zero', () => {
    render(<StarRating value={0} onChange={() => {}} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'No rating');
  });

  it('renders one hit target per half (max * 2)', () => {
    const { container } = render(<StarRating value={0} onChange={() => {}} max={5} />);
    expect(container.querySelectorAll('[data-value]').length).toBe(10);
  });

  it('clicks the left half of a star to set x.5', () => {
    const onChange = vi.fn();
    const { container } = render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(container.querySelector('[data-value="3.5"]'));
    expect(onChange).toHaveBeenCalledWith(3.5);
  });

  it('clicks the right half of a star to set x.0', () => {
    const onChange = vi.fn();
    const { container } = render(<StarRating value={0} onChange={onChange} />);
    fireEvent.click(container.querySelector('[data-value="4"]'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('clicking the current value clears it to 0', () => {
    const onChange = vi.fn();
    const { container } = render(<StarRating value={4} onChange={onChange} />);
    fireEvent.click(container.querySelector('[data-value="4"]'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('keyboard: arrows step by 0.5, Home/End jump to bounds', () => {
    const onChange = vi.fn();
    const { rerender } = render(<StarRating value={3} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(3.5);
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(2.5);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(5);
    rerender(<StarRating value={5} onChange={onChange} />);
    fireEvent.keyDown(slider, { key: 'ArrowRight' }); // clamp at max
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('read-only: not focusable, renders no hit targets, ignores keys', () => {
    const onChange = vi.fn();
    const { container } = render(<StarRating value={4} readOnly />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('tabindex', '-1');
    expect(container.querySelectorAll('[data-value]').length).toBe(0);
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
