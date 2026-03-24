import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Docs - Nqita',
  description: 'Nqita docs currently live on GitHub.',
};

export default function DocsPage() {
  return (
    <main className="site-page public-page">
      <section className="public-shell public-card">
        <div className="public-mark">NQ</div>
        <h1>Docs live on GitHub.</h1>
        <p>The site stays focused on the public identity. Technical docs, setup notes, and project details stay in the repos for now.</p>
        <div className="public-links">
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            github.com/ws-nqita
          </a>
          <a href="https://github.com/ws-nqita/nqita-cli" target="_blank" rel="noreferrer">
            nqita-cli
          </a>
          <Link href="/">home</Link>
        </div>
      </section>
    </main>
  );
}
