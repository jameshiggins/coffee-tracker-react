import { forwardRef } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { cn } from './cn.js';

/**
 * DropdownMenu — accessible menu built on @radix-ui/react-dropdown-menu.
 *
 * Radix handles: keyboard nav (Up/Down/Home/End), type-ahead, focus return,
 * ARIA roles (role=menu, role=menuitem), click-outside-to-close.
 *
 * Visual chrome uses semantic tokens. Existing FilterDropdown.jsx in
 * src/components uses its own bespoke pattern; that can migrate during the
 * adoption phase.
 *
 * Usage:
 *   <DropdownMenu>
 *     <DropdownMenu.Trigger>Filter</DropdownMenu.Trigger>
 *     <DropdownMenu.Content>
 *       <DropdownMenu.Item onSelect={() => …}>All</DropdownMenu.Item>
 *       <DropdownMenu.Separator />
 *       <DropdownMenu.Item destructive onSelect={() => …}>Clear</DropdownMenu.Item>
 *     </DropdownMenu.Content>
 *   </DropdownMenu>
 */
function DropdownMenu({ open, defaultOpen, onOpenChange, children, modal = true }) {
  return (
    <RadixMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      {children}
    </RadixMenu.Root>
  );
}

const Trigger = forwardRef(function DropdownTrigger(props, ref) {
  return <RadixMenu.Trigger ref={ref} {...props} />;
});

const Content = forwardRef(function DropdownContent(
  { className, sideOffset = 6, align = 'start', children, ...rest },
  ref
) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[10rem] max-h-[60vh] overflow-y-auto',
          'bg-surface text-fg rounded-lg border border-border shadow-lg',
          'p-1 focus:outline-none',
          className
        )}
        {...rest}
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
});

/**
 * Item — a single menu row.
 *
 * `destructive` flips the text color to danger (red-ish) so the user has a
 * clear visual cue before they hit Enter. Use sparingly.
 */
const Item = forwardRef(function DropdownItem(
  { className, destructive = false, children, ...rest },
  ref
) {
  return (
    <RadixMenu.Item
      ref={ref}
      className={cn(
        'text-sm px-2 py-1.5 rounded cursor-pointer select-none',
        'flex items-center gap-2',
        destructive ? 'text-danger' : 'text-fg',
        'data-[highlighted]:bg-surface-muted',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        'focus:outline-none',
        className
      )}
      {...rest}
    >
      {children}
    </RadixMenu.Item>
  );
});

const Separator = forwardRef(function DropdownSeparator({ className, ...props }, ref) {
  return (
    <RadixMenu.Separator
      ref={ref}
      className={cn('h-px my-1 bg-border', className)}
      {...props}
    />
  );
});

const Label = forwardRef(function DropdownLabel({ className, ...props }, ref) {
  return (
    <RadixMenu.Label
      ref={ref}
      className={cn(
        'text-[11px] uppercase tracking-wide text-fg-subtle px-2 py-1',
        className
      )}
      {...props}
    />
  );
});

DropdownMenu.Trigger = Trigger;
DropdownMenu.Content = Content;
DropdownMenu.Item = Item;
DropdownMenu.Separator = Separator;
DropdownMenu.Label = Label;

export default DropdownMenu;
