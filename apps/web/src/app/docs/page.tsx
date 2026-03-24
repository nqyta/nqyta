import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPlan, documentationLinks, homepageFacts } from '../../content/site';

export const metadata: Metadata = {
  title: 'Documentation - Nqita',
  description: 'Plain-language documentation hub for the Nqita desktop companion project.',
};

export default function DocsPage() {
  return (
    <main className="site-page docs-page">
      <header className="docs-shell docs-topbar">
        <Link className="docs-brand" href="/">
          <strong>Nqita</strong>
          <span>docs</span>
        </Link>

        <nav className="docs-nav" aria-label="Primary">
          <Link href="/">home</Link>
          <a href="#overview">overview</a>
          <a href="#links">links</a>
        </nav>
      </header>

      <section className="docs-shell docs-hero" id="overview">
        <p className="docs-kicker">Documentation</p>
        <h1>What the project is trying to build.</h1>
        <p className="docs-copy">
          This page keeps the story plain. The short version is that Nqita is an open source
          desktop companion by WokSpec, the CLI is the working prototype today, and the full desktop
          version still needs art, motion, and interface work.
        </p>
      </section>

      <section className="docs-shell docs-block">
        <div className="docs-grid">
          <div className="docs-card">
            {homepageFacts.map((fact) => (
              <p key={fact}>{fact}</p>
            ))}
          </div>

          <div className="docs-card">
            <ol className="docs-steps">
              {buildPlan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="docs-shell docs-block" id="links">
        <p className="docs-kicker">Start Here</p>
        <h2>Useful links.</h2>
        <div className="docs-list">
          {documentationLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              <strong>{link.title}</strong>
              <span>{link.description}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="docs-shell docs-block">
        <p className="docs-kicker">Current State</p>
        <h2>What is real right now.</h2>
        <div className="docs-notes">
          <p>The local runtime and CLI are the real working starting point today.</p>
          <p>The desktop presence, art direction, motion, and full visual feel are still in progress.</p>
          <p>The project needs help, especially on the art, animation, design, and frontend side.</p>
        </div>
      </section>
    </main>
  );
}
