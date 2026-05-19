/**
 * Design-system primitives barrel.
 *
 * Consumer pattern:
 *   import { Button, Card, Chip, Badge, Field,
 *            Dialog, DropdownMenu, Popover } from '../ui';
 *
 * Everything here is a primitive — tokens come from tailwind.config.js
 * (which reads CSS variables from src/styles/tokens.css). Primitives use
 * only semantic Tailwind classes (`bg-surface`, `text-fg`, `bg-accent`).
 *
 * Adoption note: the legacy components (BeanCard, FilterDropdown, etc.)
 * still use their own bespoke styling and tone maps. Migration to these
 * primitives is a separate phase — do NOT swap usage in the same change
 * that introduces the primitives.
 */
export { default as Button } from './Button.jsx';
export { default as Card } from './Card.jsx';
export { default as Chip } from './Chip.jsx';
export { default as Badge } from './Badge.jsx';
export { default as Field } from './Field.jsx';
export { default as Dialog } from './Dialog.jsx';
export { default as DropdownMenu } from './DropdownMenu.jsx';
export { default as Popover } from './Popover.jsx';

// Re-exported so the build includes the showcase even though no live route
// renders it. To eyeball the primitives, temporarily render <_Showcase />
// somewhere in your app (commonly inside App.jsx during a design pass).
export { default as _Showcase } from './_Showcase.jsx';
