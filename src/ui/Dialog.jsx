import { forwardRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from './cn.js';

/**
 * Dialog — accessible modal built on @radix-ui/react-dialog.
 *
 * Radix handles: focus-trap, ESC-to-close, click-outside-to-close, scroll
 * lock, return-focus-on-close, ARIA wiring (role=dialog, aria-modal,
 * aria-labelledby, aria-describedby).
 *
 * We own the visual chrome — backdrop bg, panel surface, close button.
 * Styles use semantic tokens (`bg-surface`, `text-fg`) so a palette change
 * ripples through.
 *
 * Usage:
 *   <Dialog>
 *     <Dialog.Trigger>Open</Dialog.Trigger>
 *     <Dialog.Content title="Confirm">
 *       <Dialog.Description>Are you sure?</Dialog.Description>
 *       …
 *       <Dialog.Close>Cancel</Dialog.Close>
 *     </Dialog.Content>
 *   </Dialog>
 *
 * For headless use, pass `title` as a string OR use Dialog.Title yourself
 * inside Content. Title is required by Radix for a11y; if you genuinely
 * don't need a visible one, wrap a visually-hidden one yourself.
 */
function Dialog({ open, defaultOpen, onOpenChange, children, modal = true }) {
  return (
    <RadixDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </RadixDialog.Root>
  );
}

const Trigger = forwardRef(function DialogTrigger(props, ref) {
  // asChild lets consumers pass a custom <Button> as the trigger without an
  // extra wrapper element. Default is a plain button.
  return <RadixDialog.Trigger ref={ref} {...props} />;
});

const Close = forwardRef(function DialogClose(props, ref) {
  return <RadixDialog.Close ref={ref} {...props} />;
});

const Title = forwardRef(function DialogTitle({ className, ...props }, ref) {
  return (
    <RadixDialog.Title
      ref={ref}
      className={cn('text-lg font-semibold text-fg', className)}
      {...props}
    />
  );
});

const Description = forwardRef(function DialogDescription({ className, ...props }, ref) {
  return (
    <RadixDialog.Description
      ref={ref}
      className={cn('text-sm text-fg-muted', className)}
      {...props}
    />
  );
});

/**
 * Content — the visible panel + backdrop.
 *
 * Pass `title` for the common case of a header row with a built-in close
 * button. Pass `hideTitle` to make the title visually hidden but still
 * accessible (required by Radix for a11y).
 */
const Content = forwardRef(function DialogContent(
  { className, children, title, hideTitle = false, ...rest },
  ref
) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        data-testid="dialog-overlay"
        className={cn(
          'fixed inset-0 z-50 bg-black/40',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
        )}
      />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-[92vw] max-w-md max-h-[85vh] overflow-y-auto',
          'bg-surface text-fg rounded-xl border border-border shadow-xl p-5',
          'focus:outline-none',
          className
        )}
        {...rest}
      >
        {title && (
          <div className="flex items-start justify-between gap-3 mb-3">
            {hideTitle ? (
              <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
            ) : (
              <Title>{title}</Title>
            )}
            <RadixDialog.Close
              aria-label="Close"
              className={cn(
                'text-fg-muted hover:text-fg leading-none',
                'w-8 h-8 -mr-1 -mt-1 inline-flex items-center justify-center rounded',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'
              )}
            >
              <span aria-hidden="true">×</span>
            </RadixDialog.Close>
          </div>
        )}
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

Dialog.Trigger = Trigger;
Dialog.Close = Close;
Dialog.Title = Title;
Dialog.Description = Description;
Dialog.Content = Content;

export default Dialog;
