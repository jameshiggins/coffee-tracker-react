import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo.js';

/**
 * Boilerplate terms of service. Same caveat as Privacy: have a lawyer
 * review before going live in a regulated jurisdiction.
 */
export default function Terms() {
  useSeo({ title: 'Terms', description: 'The terms of use for Roastmap.' });
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/" className="text-accent hover:underline text-sm">← Home</Link>
      <h1 className="text-3xl font-bold text-fg mt-3">Terms of Service</h1>
      <p className="text-xs text-fg-muted mt-1">Last updated: April 28, 2026</p>

      <Section title="Using this site">
        <p>
          By creating an account or contributing content, you agree to these terms.
          If you don't agree, please don't use the site.
        </p>
      </Section>

      <Section title="Acceptable use">
        <ul className="list-disc pl-6 space-y-1">
          <li>One account per person. Don't share accounts.</li>
          <li>Don't post content you don't have the right to share.</li>
          <li>Don't post spam, harassment, illegal content, or content that targets a specific person.</li>
          <li>Don't scrape, mirror, or commercially redistribute the directory data without permission.</li>
          <li>Don't probe, attack, or attempt to disrupt the service.</li>
        </ul>
      </Section>

      <Section title="Your content">
        <p>
          You keep the rights to your tastings and notes. By posting them publicly,
          you grant us a worldwide, non-exclusive license to display them on the site
          and in restock alert emails. You can make any tasting private at any time
          and delete it whenever you want.
        </p>
      </Section>

      <Section title="Roaster + product information">
        <p>
          Prices, stock, and product details are scraped from public roaster websites
          and may be out of date or inaccurate. Always check the roaster's own site
          before placing an order. We are not affiliated with the roasters listed
          unless explicitly stated. Logos and product names belong to their owners.
        </p>
      </Section>

      <Section title="Moderation">
        <p>
          We may hide or remove content that violates these terms. Anyone can flag a
          public tasting for moderator review. We try to act on flags within a
          reasonable time, but we don't guarantee any specific response time.
        </p>
      </Section>

      <Section title="Account suspension">
        <p>
          We may suspend or close accounts that repeatedly violate these terms.
          We'll email you first when feasible.
        </p>
      </Section>

      <Section title="Service availability">
        <p>
          The service is provided "as is" without warranty. We do not guarantee
          uptime, accuracy, or continued availability. We may add, change, or
          remove features at any time.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for any
          indirect, incidental, or consequential damages arising from your use
          of the site.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms occasionally. Material changes will be
          announced on the home page. Continued use after a change means you
          accept the updated terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions: <a href="mailto:hello@example.com" className="text-accent underline">hello@example.com</a>
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
