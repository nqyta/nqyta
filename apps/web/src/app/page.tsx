'use client';

import { FormEvent, useEffect, useState } from 'react';
import { roleOptions, spriteOptions, type RoleOption } from '../content/site';

type WaitlistEntry = {
  email: string;
  role: RoleOption;
  wantsUpdates: boolean;
  createdAt: string;
};

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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const entries = readStoredEntries();
    setSavedCount(entries.length);
    setSubmitted(entries.some((entry) => entry.email.toLowerCase() === email.toLowerCase()));
  }, [email]);
  
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % spriteOptions.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

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

  const activeSprite = spriteOptions[activeIndex];

  return (
    <main className="neon-home">
      <div className="pixel-field" aria-hidden="true" />

      <header className="simple-shell simple-topbar">
        <a className="simple-wordmark" href="#waitlist-form">
          <span className="simple-wordmark__title">nqita</span>
        </a>

        <nav className="simple-nav" aria-label="Primary">
          <a href="#waitlist-form">waitlist</a>
          <a href="#current-shells">sprites</a>
          <a href="https://github.com/ws-nqita" target="_blank" rel="noreferrer">
            github
          </a>
        </nav>
      </header>

      <section className="simple-shell simple-hero">
        <div className="simple-hero__copy">
          <p className="simple-pill">nick-ee-tah</p>
          <h1>pink terminal companion</h1>
          <p className="simple-lede">join the waitlist. pick the sprite direction.</p>

          <div className="simple-actions">
            <a className="simple-button simple-button--primary" href="#waitlist-form">
              join waitlist
            </a>
            <a className="simple-button simple-button--secondary" href="#current-shells">
              view sprites
            </a>
          </div>

          <div className="simple-stats">
            <div className="simple-stat">
              <span>saved locally</span>
              <strong>{savedCount.toString().padStart(2, '0')}</strong>
            </div>
            <div className="simple-stat">
              <span>current focus</span>
              <strong>waitlist + sprite direction</strong>
            </div>
          </div>
        </div>

        <div className="simple-hero__art">
          <div className="hero-preview">
            <div className="hero-preview__label">
              sprite {String(activeIndex + 1).padStart(2, '0')} / {String(spriteOptions.length).padStart(2, '0')}
            </div>
            <img
              key={activeSprite.src}
              className="hero-preview__sprite"
              src={activeSprite.src}
              alt={activeSprite.name}
            />
            <p className="hero-preview__note">{activeSprite.name}</p>
          </div>
        </div>
      </section>

      <section className="simple-shell simple-grid">
        <article className="simple-card" id="waitlist-form">
          <div className="simple-card__eyebrow">waitlist</div>
          <h2>early access</h2>
          <p>build drops, updates, sprite tests.</p>

          {submitted ? (
            <div className="simple-success" role="status" aria-live="polite">
              <strong>you&apos;re on the list.</strong>
              <p>This signup is currently saved locally on this device.</p>
            </div>
          ) : (
            <form className="simple-form" onSubmit={handleSubmit}>
              <label>
                email
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label>
                role
                <select value={role} onChange={(event) => setRole(event.target.value as RoleOption)}>
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="simple-checkbox">
                <input
                  type="checkbox"
                  checked={wantsUpdates}
                  onChange={(event) => setWantsUpdates(event.target.checked)}
                />
                <span>send updates about builds and sprite direction</span>
              </label>

              <button className="simple-button simple-button--primary" type="submit">
                join waitlist
              </button>
            </form>
          )}
        </article>

        <article className="simple-card simple-card--soft">
          <div className="simple-card__eyebrow">live picker</div>
          <h2>8 animated candidates</h2>
          <ul className="simple-list">
            <li>all looping</li>
            <li>auto-rotating</li>
            <li>tap to switch</li>
          </ul>
        </article>
      </section>

      <section className="simple-shell simple-sprites" id="current-shells">
        <div className="section-heading">
          <div className="panel__eyebrow">sprite candidates</div>
          <h2>pick one</h2>
        </div>

        <div className="simple-sprite-grid">
          {spriteOptions.map((sprite, index) => (
            <button
              key={sprite.src}
              className={`simple-sprite-card${index === activeIndex ? ' simple-sprite-card--active' : ''}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${sprite.name}`}
            >
              <div className="simple-sprite-card__media">
                <img src={sprite.src} alt="" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer className="simple-shell simple-footer">
        <span>nqita.wokspec.org</span>
        <div className="simple-nav">
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
