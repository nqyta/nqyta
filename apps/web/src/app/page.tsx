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

type SpriteCard = {
  title: string;
  src: string;
  note: string;
  status: string;
};

const roleOptions: RoleOption[] = [
  'Terminal User',
  'Developer',
  'Founder',
  'Pixel Artist',
  'Designer',
  'Curious Human',
];

const storageKey = 'nqita-waitlist-v1';

const currentSprites: SpriteCard[] = [
  {
    title: 'chibi cyborg',
    src: '/nqita-sprites/current/chibi-cyborg.gif',
    status: 'available now',
    note: 'Feels closest to a lightweight everyday desktop companion.',
  },
  {
    title: 'simple pink runner',
    src: '/nqita-sprites/current/simple-cyborg.gif',
    status: 'available now',
    note: 'Fast silhouette. Reads clearly at tiny overlay sizes.',
  },
  {
    title: 'cube core',
    src: '/nqita-sprites/current/cube-core.gif',
    status: 'available now',
    note: 'Less human, more daemon familiar. Could work for utility mode.',
  },
  {
    title: 'armored girl',
    src: '/nqita-sprites/current/armored-girl.gif',
    status: 'available now',
    note: 'Heavier and bolder. Strong personality, less subtle on desktop.',
  },
];

const plannedSprites: SpriteCard[] = [
  {
    title: 'full walk-cycle shell',
    src: '/nqita-sprites/planned/walk-cycle-south.png',
    status: 'planned',
    note: 'Most promising route for desktop wandering, idles, and scene transitions.',
  },
  {
    title: 'computer-head form',
    src: '/nqita-sprites/planned/computer-head-south.png',
    status: 'planned',
    note: 'A stranger, more agentic body plan if we want her to feel less mascot-like.',
  },
  {
    title: 'monitor-body form',
    src: '/nqita-sprites/planned/monitor-body-south.png',
    status: 'planned',
    note: 'Leans into workstation embodiment and terminal-origin identity.',
  },
  {
    title: 'soft chibi front',
    src: '/nqita-sprites/planned/chibi-south.png',
    status: 'planned',
    note: 'Cute and readable. Good fallback for broad public-facing surfaces.',
  },
];

const presenceSteps = [
  'talk to her in your terminal',
  'let her stay present as a local daemon',
  'give her a visible pixel body on desktop',
  'expand into browser, tools, and operating-system context',
];

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

  const progressValue = useMemo(() => Math.min(94, 34 + savedCount * 7), [savedCount]);

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
      <div className="sky-glow sky-glow--one" aria-hidden="true" />
      <div className="sky-glow sky-glow--two" aria-hidden="true" />

      <header className="topbar shell">
        <a className="wordmark" href="#waitlist-form">
          <span className="wordmark__kicker">alpha waitlist</span>
          <span className="wordmark__title">nqita</span>
        </a>

        <nav className="topbar__nav" aria-label="Primary">
          <a href="#waitlist-form">waitlist</a>
          <a href="#current-shells">sprites</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            github
          </a>
        </nav>
      </header>

      <section className="hero shell">
        <div className="hero__copy">
          <p className="pixel-pill">pink pixel agent in progress</p>
          <h1>
            terminal first.
            <br />
            body still evolving.
          </h1>
          <p className="hero__lede">
            Nqita is a persistent AI agent that starts in the CLI and keeps expanding into your
            desktop, browser, tools, and eventually the operating system itself. We are not locking
            a final identity yet. We are testing bodies, motion, presence, and tone in public.
          </p>

          <div className="pixel-meter">
            <div className="pixel-meter__label">
              <span>sprite direction</span>
              <strong>{progressValue}% awake</strong>
            </div>
            <div className="pixel-meter__bar" aria-hidden="true">
              <span style={{ width: `${progressValue}%` }} />
            </div>
          </div>

          <div className="signal-row">
            <div className="signal-tile">
              <strong>available now</strong>
              <p>Multiple candidate Nqitas are already on the table and visible below.</p>
            </div>
            <div className="signal-tile">
              <strong>not a logo yet</strong>
              <p>Identity is being discovered through sprite work, not a locked brand mark.</p>
            </div>
            <div className="signal-tile">
              <strong>waitlist first</strong>
              <p>Join early if you want terminal builds, sprite drops, and implementation updates.</p>
            </div>
          </div>
        </div>

        <div className="hero__scene" aria-label="Current sprite concept scene">
          <div className="scene-card">
            <div className="scene-card__header">
              <span>candidate shell</span>
              <strong>hero render</strong>
            </div>

            <div className="scene-card__room">
              <div className="scene-card__stars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="scene-card__window" />
              <div className="scene-card__desk" />
              <div className="scene-card__plant" />
              <img
                className="scene-card__sprite"
                src="/nqita-sprites/hero-agent.png"
                alt="Current Nqita sprite candidate render"
              />
              <div className="scene-card__note scene-card__note--left">current mood: soft cyborg operator</div>
              <div className="scene-card__note scene-card__note--right">identity still in motion</div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell content-grid">
        <article className="panel panel--waitlist" id="waitlist-form">
          <div className="panel__eyebrow">join the waitlist</div>
          <h2>Get the first builds while the body and behavior are still being shaped.</h2>
          <p>
            Signups are captured in this browser right now while the shared endpoint is still being
            wired. The flow is already the right one: simple, direct, and focused on early access.
          </p>

          {submitted ? (
            <div className="success-box" role="status" aria-live="polite">
              <strong>slot saved.</strong>
              <p>
                You&apos;re on this device&apos;s local waitlist. When the shared backend lands, the
                page flow can stay the same.
              </p>
            </div>
          ) : (
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <label>
                email
                <input
                  type="email"
                  required
                  placeholder="you@persistentagents.dev"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                you are
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
                <span>send sprite drops, terminal builds, and launch notes</span>
              </label>

              <button className="pixel-button pixel-button--primary" type="submit">
                reserve my slot
              </button>
            </form>
          )}
        </article>

        <article className="panel panel--presence">
          <div className="panel__eyebrow">what we are building</div>
          <h2>a persistent agent with a body, not just a chat box.</h2>
          <ul className="presence-list">
            {presenceSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <div className="tiny-stat">
            <span>saved local signups</span>
            <strong>{savedCount.toString().padStart(2, '0')}</strong>
          </div>
        </article>
      </section>

      <section className="shell gallery-section" id="current-shells">
        <div className="section-heading">
          <div className="panel__eyebrow">current nqitas</div>
          <h2>these are the candidate bodies we can show right now.</h2>
          <p>
            None of these are being declared final. They are the current visual directions available
            for testing motion, feel, and readability.
          </p>
        </div>

        <div className="sprite-grid">
          {currentSprites.map((sprite) => (
            <article key={sprite.title} className="sprite-card">
              <div className="sprite-card__media">
                <img src={sprite.src} alt={sprite.title} />
              </div>
              <div className="sprite-card__body">
                <span>{sprite.status}</span>
                <strong>{sprite.title}</strong>
                <p>{sprite.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell gallery-section">
        <div className="section-heading">
          <div className="panel__eyebrow">planned directions</div>
          <h2>forms we are actively experimenting with next.</h2>
          <p>
            These are not promises. They are the branches of identity we are exploring while Nqita is
            still becoming herself.
          </p>
        </div>

        <div className="sprite-grid sprite-grid--planned">
          {plannedSprites.map((sprite) => (
            <article key={sprite.title} className="sprite-card sprite-card--planned">
              <div className="sprite-card__media sprite-card__media--planned">
                <img src={sprite.src} alt={sprite.title} />
              </div>
              <div className="sprite-card__body">
                <span>{sprite.status}</span>
                <strong>{sprite.title}</strong>
                <p>{sprite.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell lower-grid">
        <article className="panel panel--code">
          <div className="panel__eyebrow">runtime shape</div>
          <h2>simple entry. ambitious destination.</h2>
          <pre>{`nqita chat
  -> local daemon
  -> sprite state
  -> byok or hosted path
  -> browser + desktop presence
  -> os-level integration over time`}</pre>
        </article>

        <article className="panel panel--soft">
          <div className="panel__eyebrow">design rule</div>
          <h2>the sprite does the branding for now.</h2>
          <p>
            We are deliberately not forcing a final logo before the product has a stable body. The
            site should feel alive through motion, scene, and candidate characters instead.
          </p>
        </article>
      </section>

      <footer className="footer shell">
        <span>nqita.wokspec.org</span>
        <div className="footer__links">
          <a href="#waitlist-form">waitlist</a>
          <a href="#current-shells">sprites</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            ws-nqita
          </a>
        </div>
      </footer>
    </main>
  );
}
