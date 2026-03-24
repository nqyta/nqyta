import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contribute - Nqita',
  description: 'Nqita contribution entry points currently live on GitHub.',
};

export default function ContributePage() {
  return (
    <main className="site-page public-page">
      <section className="public-shell public-card">
        <div className="public-mark">NQ</div>
        <h1>Contribution lives on GitHub.</h1>
        <p>Issues, project direction, and the current contribution flow all live in the GitHub org while the site stays lightweight.</p>
        <div className="public-links">
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            github.com/ws-nqita
          </a>
          <a
            href="https://github.com/ws-nqita/nqita/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
          >
            contributing
          </a>
          <Link href="/">home</Link>
        </div>
      </section>
    </main>
  );
}
