'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type RoleOption =
  | 'Terminal User'
  | 'Developer'
  | 'Founder'
  | 'Pixel Artist'
  | 'Designer'
  | 'Curious Human';

type WaitlistEntry = {
  email: string;
  role: RoleOption;
  wantsUpdates: boolean;
  createdAt: string;
};

const roleOptions: RoleOption[] = [
  'Terminal User',
  'Developer',
  'Founder',
  'Pixel Artist',
  'Designer',
  'Curious Human',
];

const signalCards = [
  {
    label: 'starts in terminal',
    detail: 'Talk to Nqita directly from your CLI first. That is the first surface, not an afterthought.',
  },
  {
    label: 'persists everywhere',
    detail: 'The goal is an agent that follows your work across tools, tabs, windows, and eventually the OS itself.',
  },
  {
    label: 'bring your own key',
    detail: 'Use your own model keys or use the hosted path with limits while the system matures.',
  },
];

const questSteps = [
  'Join the waitlist.',
  'Get the terminal-first builds.',
  'Watch Nqita evolve into a real OS-level agent.',
];

const storageKey = 'nqita-waitlist-v1';

function readStoredEntries(): WaitlistEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleOption>('Terminal User');
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const entries = readStoredEntries();
    setSavedCount(entries.length);
    setSubmitted(entries.some((entry) => entry.email.toLowerCase() === email.toLowerCase()));
  }, [email]);

  const progressValue = useMemo(() => Math.min(92, 38 + savedCount * 8), [savedCount]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return;
    }

    const nextEntry: WaitlistEntry = {
      email: normalizedEmail,
      role,
      wantsUpdates,
      createdAt: new Date().toISOString(),
    };

    const entries = readStoredEntries();
    const deduped = entries.filter((entry) => entry.email !== normalizedEmail);
    const nextEntries = [nextEntry, ...deduped].slice(0, 250);

    window.localStorage.setItem(storageKey, JSON.stringify(nextEntries));
    setSavedCount(nextEntries.length);
    setSubmitted(true);
  }

  return (
    <main className="waitlist-page">
      <div className="waitlist-grid" aria-hidden="true" />

      <header className="topbar shell">
        <a className="brandmark" href="#waitlist-form">
          <span className="brandmark__sprite">NQ</span>
          <span>
            <strong>Nqita</strong>
            <small>persistent pink ai agent</small>
          </span>
        </a>

        <nav className="topbar__nav" aria-label="Primary">
          <a href="#waitlist-form">Waitlist</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <section className="hero shell">
        <div className="hero__copy">
          <p className="pixel-pill">pixel agent waitlist</p>
          <h1>
            starts in your terminal.
            <br />
            keeps growing everywhere.
          </h1>
          <p className="hero__lede">
            Nqita is an AI agent that begins in the CLI and keeps pushing outward: into your desktop,
            your tools, your browser, and eventually the operating system itself. She should feel
            persistent, embodied, pink, and a little unreal.
          </p>

          <div className="hero__actions">
            <a className="pixel-button pixel-button--primary" href="#waitlist-form">
              Join the waitlist
            </a>
            <a className="pixel-button pixel-button--secondary" href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
              See the build
            </a>
          </div>

          <div className="quest-panel">
            <div className="quest-panel__header">
              <span>build meter</span>
              <strong>{progressValue}% awake</strong>
            </div>
            <div className="quest-bar" aria-hidden="true">
              <span style={{ width: `${progressValue}%` }} />
            </div>
            <ul className="quest-list">
              {questSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hero__art" aria-hidden="true">
          <div className="pixel-card">
            <div className="pixel-card__spark pixel-card__spark--one" />
            <div className="pixel-card__spark pixel-card__spark--two" />
            <div className="pixel-card__spark pixel-card__spark--three" />

            <div className="sprite-stage">
              <div className="sprite-stage__halo" />
              <div className="sprite">
                <span className="sprite__bow" />
                <span className="sprite__eye sprite__eye--left" />
                <span className="sprite__eye sprite__eye--right" />
                <span className="sprite__blush sprite__blush--left" />
                <span className="sprite__blush sprite__blush--right" />
              </div>
              <div className="sprite-stage__platform" />
            </div>

            <div className="unlock-grid">
              <div className="unlock-card">
                <span>phase one</span>
                <strong>terminal</strong>
              </div>
              <div className="unlock-card">
                <span>phase two</span>
                <strong>desktop</strong>
              </div>
              <div className="unlock-card">
                <span>phase three</span>
                <strong>everywhere</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell content-grid">
        <article className="panel panel--soft" id="waitlist-form">
          <div className="panel__eyebrow">waitlist</div>
          <h2>Get on the list for the first terminal-first builds.</h2>
          <p>
            This version stores signups locally in the browser until the shared endpoint is wired. The
            product direction is already clear: Nqita should persist wherever she can.
          </p>

          {submitted ? (
            <div className="success-box" role="status" aria-live="polite">
              <strong>You&apos;re on the list.</strong>
              <p>
                Your signup is saved locally in this browser. The live waitlist endpoint can replace
                this later without changing the page flow.
              </p>
            </div>
          ) : (
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  required
                  placeholder="you@persistentagents.dev"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                You are
                <select value={role} onChange={(event) => setRole(event.target.value as RoleOption)}>
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={wantsUpdates}
                  onChange={(event) => setWantsUpdates(event.target.checked)}
                />
                <span>Send me launch notes, build drops, and access updates.</span>
              </label>

              <button className="pixel-button pixel-button--primary" type="submit">
                Save my slot
              </button>
            </form>
          )}
        </article>

        <article className="panel">
          <div className="panel__eyebrow">what Nqita is</div>
          <h2>Not another tab. Not another dashboard.</h2>
          <div className="contributor-list">
            {signalCards.map((item) => (
              <div key={item.label} className="contributor-card">
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="tiny-stat">
            <span>saved local signups</span>
            <strong>{savedCount.toString().padStart(2, '0')}</strong>
          </div>
        </article>
      </section>

      <section className="shell lower-grid">
        <article className="panel">
          <div className="panel__eyebrow">runtime direction</div>
          <h2>Bring your own key, or use the hosted path with limits.</h2>
          <p>
            Nqita should work in two modes. Bring your own key if you want full control over providers
            and cost, or use the hosted path with guardrails and limits while the ecosystem gets built.
          </p>
          <p>
            The first public experience starts in the terminal. The long-term version is a full OS-level
            integrated agent that can live across your work instead of inside a single app.
          </p>
        </article>

        <article className="panel panel--code">
          <div className="panel__eyebrow">shape of the thing</div>
          <h2>Terminal first. Desktop next.</h2>
          <pre>{`nqita chat
  -> local daemon
  -> byok or hosted model path
  -> sprite state + memory
  -> deeper OS integration over time`}</pre>
        </article>
      </section>

      <footer className="footer shell">
        <span>nqita.wokspec.org</span>
        <div className="footer__links">
          <a href="#waitlist-form">Waitlist</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            ws-nqita
          </a>
        </div>
      </footer>
    </main>
  );
}
