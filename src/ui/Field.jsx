import { Children, cloneElement, isValidElement, useId } from 'react';
import { cn } from './cn.js';

/**
 * Field — labelled-control wrapper.
 *
 * Composes a label + (optional hint) + your control + (optional error). The
 * control is passed as a child; Field does NOT rendering inputs — it only
 * wires up id/htmlFor/aria-describedby/aria-invalid for accessibility.
 *
 * Usage:
 *   <Field label="Email" hint="We'll never share it." error={emailError}>
 *     <input type="email" value={...} onChange={...} />
 *   </Field>
 *
 * If a single child element is given, Field auto-injects:
 *   - id (when missing)
 *   - aria-describedby (concatenated hint + error ids)
 *   - aria-invalid (when error is set)
 *
 * If multiple children, no auto-wiring happens — let the consumer set ids
 * manually. (Common case: an input group with prefix/suffix.)
 *
 * Field deliberately does NOT impose input styling — input chrome belongs in
 * its own primitive (or stays inline for now). This keeps Field reusable for
 * inputs, selects, textareas, custom widgets, etc.
 */
export default function Field({
  label,
  hint,
  error,
  required = false,
  className,
  labelClassName,
  hintClassName,
  errorClassName,
  children,
}) {
  // Stable ids per Field instance.
  const reactId = useId();
  const controlId = `field-${reactId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  // Single-child auto-wire. Multi-child: leave it to the consumer.
  let controls = children;
  const onlyChild =
    Children.count(children) === 1 && isValidElement(children) ? children : null;

  // Resolve the id we'll use for both <label htmlFor> and the cloned child.
  // Honour an id the consumer already set on the child; otherwise fall back
  // to the React-generated one.
  const resolvedId = onlyChild ? (onlyChild.props.id || controlId) : null;

  if (onlyChild) {
    const describedBy = [
      onlyChild.props['aria-describedby'],
      hintId,
      errorId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    controls = cloneElement(onlyChild, {
      id: resolvedId,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : onlyChild.props['aria-invalid'],
      'aria-required': required || onlyChild.props['aria-required'] || undefined,
    });
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={resolvedId || undefined}
          className={cn('text-sm font-medium text-fg', labelClassName)}
        >
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden="true">*</span>
          )}
        </label>
      )}
      {controls}
      {hint && !error && (
        <p id={hintId} className={cn('text-xs text-fg-subtle', hintClassName)}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn('text-xs text-danger', errorClassName)}
        >
          {error}
        </p>
      )}
    </div>
  );
}
