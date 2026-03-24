import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute to Nqita',
  description: 'Open-source contribution guide for artists, developers, designers, and builders helping bring Nqita to life.',
};

const tracks = [
  {
    title: 'Pixel artists and animators',
    body:
      'Nqita needs idle loops, walk cycles, reactions, researching scenes, desk props, and a stronger visual vocabulary. This is one of the highest leverage areas in the whole project.',
    bullets: [
      'Start with idle, walk, and reaction sprite sheets.',
      'Use the sprite spec in the main repo as the source of truth.',
      'Open draft PRs early so style direction can converge in public.',
    ],
  },
  {
    title: 'Systems and platform developers',
    body:
      'The daemon, CLI, provider routing, memory, overlay bridge, and OS-specific embodiment stack all need real implementation work.',
    bullets: [
      'Good starting surfaces: nqita-cli prototype, daemon protocol, provider adapters, and desktop overlay experiments.',
      'Groq is the native default, but the system should stay cleanly BYOK-capable.',
      'Cross-platform overlay help is especially valuable.',
    ],
  },
  {
    title: 'Designers, UX, and product contributors',
    body:
      'Nqita should feel present without being annoying. That balance depends on interaction design, motion judgment, and restraint.',
    bullets: [
      'Bubble design, onboarding, mode transitions, and desktop presence all need iteration.',
      'Full-view logs and sprite behavior should feel coherent rather than bolted together.',
      'Mockups, interaction notes, and critique are all useful contributions.',
    ],
  },
];

export default function ContributePage() {
  return (
    <main className="waitlist-page">
      <div className="waitlist-grid" aria-hidden="true" />

      <header className="topbar shell">
        <a className="brandmark" href="/">
          <span className="brandmark__sprite">NQ</span>
          <span>
            <strong>Nqita</strong>
            <small>open source desktop companion</small>
          </span>
        </a>

        <nav className="topbar__nav" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/docs">Docs</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <section className="shell contribute-hero">
        <article className="panel panel--soft">
          <div className="panel__eyebrow">help bring her to life</div>
          <h1 className="contribute-title">Nqita needs more than code.</h1>
          <p>
            This project only becomes real if artists, runtime developers, platform engineers,
            designers, and curious builders all push on it together. We are actively recruiting open
            source contributors who want to help shape both the character and the system.
          </p>
          <div className="hero__actions">
            <a
              className="pixel-button pixel-button--primary"
              href="https://github.com/ws-nqita/nqita/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
            >
              Read main CONTRIBUTING
            </a>
            <a
              className="pixel-button pixel-button--secondary"
              href="https://github.com/ws-nqita"
              target="_blank"
              rel="noreferrer"
            >
              Browse the org
            </a>
          </div>
        </article>
      </section>

      <section className="shell contribute-grid">
        {tracks.map((track) => (
          <article key={track.title} className="panel">
            <div className="panel__eyebrow">contributor track</div>
            <h2>{track.title}</h2>
            <p>{track.body}</p>
            <ul className="proof-list">
              {track.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="shell lower-grid">
        <article className="panel">
          <div className="panel__eyebrow">current surfaces</div>
          <h2>Where contributions land right now.</h2>
          <ul className="proof-list">
            <li>`ws-nqita/nqita` for the main platform, docs, web presence, and sprite-system contracts.</li>
            <li>`ws-nqita/nqita-cli` for the local daemon, chat CLI, and Groq-first prototype runtime.</li>
            <li>The contribution docs in the main repo are the canonical entry point for deeper technical context.</li>
          </ul>
        </article>

        <article className="panel panel--code">
          <div className="panel__eyebrow">fastest onboarding</div>
          <h2>Open source quickstart.</h2>
          <pre>{`git clone git@github.com:ws-nqita/nqita.git
git clone git@github.com:ws-nqita/nqita-cli.git

# Read first:
- nqita/README.md
- nqita/CONTRIBUTING.md
- nqita/docs/SPRITE_SYSTEM.md
- nqita-cli/README.md`}</pre>
        </article>
      </section>

      <footer className="footer shell">
        <span>nqita.wokspec.org/contribute</span>
        <div className="footer__links">
          <a href="/">Home</a>
          <a href="/docs">Docs</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            ws-nqita
          </a>
        </div>
      </footer>
    </main>
  );
}
