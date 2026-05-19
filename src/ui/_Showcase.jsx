import { useState } from 'react';
import Button from './Button.jsx';
import Card from './Card.jsx';
import Chip from './Chip.jsx';
import Badge from './Badge.jsx';
import Field from './Field.jsx';
import Dialog from './Dialog.jsx';
import DropdownMenu from './DropdownMenu.jsx';
import Popover from './Popover.jsx';

/**
 * Showcase — every primitive on one page for eyeball QA.
 *
 * NOT routed. Imported via the ui barrel so Vite includes it in the build
 * even though nothing currently renders it. To see it during dev, drop
 * `import { _Showcase } from './ui'` into App.jsx temporarily and render
 * `<_Showcase />` instead of <App />.
 *
 * The next-phase adoption agent will use this file as a reference for
 * "what does the canonical primitive look like" before migrating each
 * legacy component over.
 */
export default function Showcase() {
  const [emailError, setEmailError] = useState('');
  return (
    <div className="min-h-screen bg-surface text-fg p-8 max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Design system — primitives</h1>
        <p className="text-fg-muted mt-1">
          One example per primitive. Tokens live in tokens.css; tailwind.config.js
          maps the semantic names. Adoption across the app is a separate phase.
        </p>
      </header>

      {/* ---------- Buttons ---------- */}
      <Section title="Button">
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
        <div className="flex flex-wrap gap-2 items-center mt-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button as="a" href="#" variant="secondary">As link</Button>
          <Button leftIcon={<span>☕</span>}>With icon</Button>
        </div>
      </Section>

      {/* ---------- Cards ---------- */}
      <Section title="Card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card><strong>Default</strong><p className="text-fg-muted text-sm mt-1">Standard chrome.</p></Card>
          <Card variant="elevated"><strong>Elevated</strong><p className="text-fg-muted text-sm mt-1">Lifts off the page.</p></Card>
          <Card variant="flat"><strong>Flat</strong><p className="text-fg-muted text-sm mt-1">No shadow.</p></Card>
        </div>
      </Section>

      {/* ---------- Chips ---------- */}
      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          {['amber','emerald','cyan','sky','stone','yellow','orange','red','accent','neutral'].map(t => (
            <Chip key={t} tone={t}>{t}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip tone="emerald" onClick={() => {}}>Interactive</Chip>
          <Chip tone="amber" onClick={() => {}} count={12}>With count</Chip>
          <Chip tone="sky" size="sm">Size sm</Chip>
          <Chip tone="sky" size="md">Size md</Chip>
        </div>
      </Section>

      {/* ---------- Badges ---------- */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge tone="red">no longer sold</Badge>
          <Badge tone="emerald">verified</Badge>
          <Badge tone="stone">private</Badge>
          <Badge tone="info">info</Badge>
          <Badge tone="warning">warning</Badge>
          <Badge tone="danger">danger</Badge>
        </div>
      </Section>

      {/* ---------- Field ---------- */}
      <Section title="Field">
        <div className="space-y-4 max-w-md">
          <Field label="Display name" hint="Shown on tastings you post publicly.">
            <input
              type="text"
              defaultValue=""
              className="border border-border rounded-md px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
          <Field
            label="Email"
            required
            error={emailError}
            hint="We won't share it."
          >
            <input
              type="email"
              onBlur={(e) => setEmailError(e.target.value.includes('@') ? '' : 'Enter a valid email.')}
              className="border border-border rounded-md px-3 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
        </div>
      </Section>

      {/* ---------- Dialog ---------- */}
      <Section title="Dialog">
        <Dialog>
          <Dialog.Trigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </Dialog.Trigger>
          <Dialog.Content title="Confirm action">
            <Dialog.Description>
              Are you sure you want to do the thing? This action is reversible.
            </Dialog.Description>
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button variant="primary">Do it</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog>
      </Section>

      {/* ---------- DropdownMenu ---------- */}
      <Section title="DropdownMenu">
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary">Open menu</Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Label>Sort by</DropdownMenu.Label>
            <DropdownMenu.Item>Price (low to high)</DropdownMenu.Item>
            <DropdownMenu.Item>Price (high to low)</DropdownMenu.Item>
            <DropdownMenu.Item>Name (A-Z)</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item destructive>Clear filters</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Section>

      {/* ---------- Popover ---------- */}
      <Section title="Popover">
        <Popover>
          <Popover.Trigger asChild>
            <Button variant="ghost" aria-label="More info">?</Button>
          </Popover.Trigger>
          <Popover.Content>
            <div className="text-sm">
              <p className="font-semibold">¢/g</p>
              <p className="text-fg-muted mt-1">
                Cents per gram lets you compare prices across different bag sizes.
              </p>
            </div>
            <Popover.Arrow />
          </Popover.Content>
        </Popover>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
