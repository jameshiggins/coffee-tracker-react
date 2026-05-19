import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Field from './Field.jsx';

describe('Field', () => {
  it('renders a label and wires it to the child input via htmlFor/id', () => {
    render(
      <Field label="Email">
        <input type="email" />
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('renders a hint and links it via aria-describedby', () => {
    render(
      <Field label="Email" hint="We will not share.">
        <input type="email" />
      </Field>
    );
    const input = screen.getByLabelText('Email');
    const hint = screen.getByText('We will not share.');
    expect(input).toHaveAttribute('aria-describedby', hint.id);
  });

  it('renders an error and sets aria-invalid + role=alert', () => {
    render(
      <Field label="Email" error="Required">
        <input type="email" />
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Required');
    expect(input).toHaveAttribute('aria-describedby', error.id);
  });

  it('hides the hint when an error is present (error takes precedence)', () => {
    render(
      <Field label="Email" hint="hint text" error="boom">
        <input type="email" />
      </Field>
    );
    expect(screen.queryByText('hint text')).not.toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('shows a required asterisk and sets aria-required', () => {
    render(
      <Field label="Email" required>
        <input type="email" />
      </Field>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-required', 'true');
  });

  it('respects a pre-set id on the child', () => {
    render(
      <Field label="Email">
        <input id="custom-id" type="email" />
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('preserves an existing aria-describedby on the child', () => {
    render(
      <Field label="Email" hint="hint">
        <input type="email" aria-describedby="external-help" />
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-describedby')).toMatch(/external-help/);
    expect(input.getAttribute('aria-describedby')).toMatch(/hint/);
  });

  it('does not auto-wire when given multiple children (consumer-managed)', () => {
    render(
      <Field label="Compound">
        <input id="left" />
        <input id="right" />
      </Field>
    );
    // Label has no htmlFor in this mode.
    const label = screen.getByText('Compound');
    expect(label).not.toHaveAttribute('for');
  });
});
