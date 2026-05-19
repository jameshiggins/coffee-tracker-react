import { forwardRef } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { cn } from './cn.js';

/**
 * Popover — non-modal floating panel built on @radix-ui/react-popover.
 *
 * Use Popover (NOT Dialog) for tooltips-with-content, filter pickers,
 * hover-cards, etc. — anything that doesn't need a focus trap or scroll lock.
 *
 * Radix handles: positioning (side, align, collision avoidance), focus
 * return, click-outside-to-close, ARIA wiring.
 *
 * Usage:
 *   <Popover>
 *     <Popover.Trigger>?</Popover.Trigger>
 *     <Popover.Content>Helpful context</Popover.Content>
 *   </Popover>
 */
function Popover({ open, defaultOpen, onOpenChange, children, modal = false }) {
  return (
    <RadixPopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </RadixPopover.Root>
  );
}

const Trigger = forwardRef(function PopoverTrigger(props, ref) {
  return <RadixPopover.Trigger ref={ref} {...props} />;
});

const Close = forwardRef(function PopoverClose(props, ref) {
  return <RadixPopover.Close ref={ref} {...props} />;
});

/**
 * Content — the floating panel. Defaults:
 *   - 8px offset from the trigger
 *   - center-aligned
 *   - max 24rem wide, scrolls vertically if content overflows
 */
const Content = forwardRef(function PopoverContent(
  {
    className,
    sideOffset = 8,
    align = 'center',
    side = 'bottom',
    children,
    ...rest
  },
  ref
) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        side={side}
        className={cn(
          'z-50 max-w-sm max-h-[60vh] overflow-y-auto',
          'bg-surface text-fg rounded-lg border border-border shadow-lg',
          'p-3 focus:outline-none',
          className
        )}
        {...rest}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
});

const Arrow = forwardRef(function PopoverArrow({ className, ...props }, ref) {
  return (
    <RadixPopover.Arrow
      ref={ref}
      className={cn('fill-surface', className)}
      {...props}
    />
  );
});

Popover.Trigger = Trigger;
Popover.Close = Close;
Popover.Content = Content;
Popover.Arrow = Arrow;

export default Popover;
