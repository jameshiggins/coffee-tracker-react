import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo.js';

/**
 * Boilerplate privacy policy. Plain language, no legalese, but covers:
 * - what we collect (account info, IP for geolocation, content we create)
 * - third parties (Google OAuth, Resend, ipapi.co, Nominatim)
 * - retention + deletion
 * - contact for a takedown / data-export / account-delete
 *
 * If you operate this in a regulated jurisdiction (CA, EU, etc.), have
 * a lawyer review before going live. This is a starting point, not
 * legal advice.
 */
export default function Privacy() {
  useSeo({ title: 'Privacy', description: 'How Roastmap collects, uses, and protects your data.' });
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/" className="text-accent hover:underline text-sm">← Home</Link>
      <h1 className="text-3xl font-bold text-fg mt-3">Privacy Policy</h1>
      <p className="text-xs text-fg-muted mt-1">Last updated: April 28, 2026</p>

      <Section title="What this site does">
        <p>
          Roastmap is a public directory of Canadian micro-roasters.
          We scrape roaster websites to track current beans, prices, and stock.
          Signed-in users can rate beans, write tasting notes, and keep a wishlist.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account info:</strong> email address (required), display name, optional avatar URL.</li>
          <li><strong>Content you create:</strong> tastings (rating, notes, brew method, date), wishlist entries.</li>
          <li><strong>Login method:</strong> if you sign in with Google, we receive your Google account ID and avatar URL.</li>
          <li><strong>Approximate location:</strong> we use your IP address (via <a className="underline" href="https://ipapi.co" target="_blank" rel="noopener noreferrer">ipapi.co</a>) to suggest nearby roasters. You can override or clear this in your browser at any time.</li>
          <li><strong>Standard server logs:</strong> IP, timestamp, URL, user agent — kept ~30 days.</li>
        </ul>
      </Section>

      <Section title="What we do NOT collect">
        <ul className="list-disc pl-6 space-y-1">
          <li>No tracking pixels, no third-party advertising, no analytics SDKs.</li>
          <li>No payment info — we don't sell anything; purchases happen on the roaster's own site.</li>
          <li>No precise GPS — only IP-based city-level location.</li>
        </ul>
      </Section>

      <Section title="Third parties we share data with">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google</strong> — only if you choose to sign in with Google.</li>
          <li><strong>Resend</strong> — sends transactional email (verification, password reset, restock alerts).</li>
          <li><strong>OpenStreetMap / Nominatim</strong> — used to geocode roaster street addresses (admin-only); your data is never sent.</li>
        </ul>
        <p className="mt-2">We do not sell your data. We do not use it for advertising.</p>
      </Section>

      <Section title="Public vs. private content">
        <p>
          Each tasting has a <em>public</em> toggle. Public tastings appear on the bean's page,
          on your public profile (<code>/u/your-name</code>), and at a permalink (<code>/t/123</code>).
          Private tastings are visible only to you. Your wishlist is always private.
        </p>
      </Section>

      <Section title="Reports + moderation">
        <p>
          Anyone can flag a public tasting for review. A flagged tasting stays visible
          until a moderator reviews it. We may hide content that violates the Terms.
          Hidden content is retained for audit purposes for up to 90 days, then deleted.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          To delete your account, email us at the address below. We will remove your
          profile, tastings, wishlist, and any personal data within 30 days.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Privacy questions, data-export requests, takedowns:{' '}
          <a href="mailto:privacy@example.com" className="text-accent underline">privacy@example.com</a>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold text-fg mb-2">{title}</h2>
      <div className="text-fg-muted leading-relaxed">{children}</div>
    </section>
  );
}
