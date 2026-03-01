'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('eral_api_key');
    if (!key) {
      router.replace('/login');
    } else {
      setHasKey(true);
    }
    setReady(true);
  }, [router]);

  if (!ready || !hasKey) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
          }}
        >
          Eral
        </span>
        <Link
          href="/chat"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Open Chat
        </Link>
      </nav>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            color: '#a78bfa',
            padding: '0.25rem 0.875rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
          }}
        >
          <span>✦</span>
          <span>WokSpec AI</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Eral
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.375rem)',
            color: 'var(--muted)',
            maxWidth: '28rem',
            lineHeight: 1.6,
            marginBottom: '3rem',
          }}
        >
          Your AI. Built into WokSpec.
        </p>

        <Link
          href="/chat"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.875rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Open Chat →
        </Link>

        {/* Capability cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            maxWidth: '48rem',
            width: '100%',
            marginTop: '5rem',
          }}
        >
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '1.5rem',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{cap.icon}</div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  marginBottom: '0.375rem',
                  color: 'var(--foreground)',
                }}
              >
                {cap.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '0.8125rem',
          color: 'var(--muted)',
        }}
      >
        <span>© 2025 WokSpec · Eral AI</span>
      </footer>
    </div>
  );
}

const CAPABILITIES = [
  {
    icon: '💬',
    title: 'Chat',
    description:
      'Have natural conversations with Eral. Ask questions, brainstorm ideas, and get instant answers.',
  },
  {
    icon: '✍️',
    title: 'Generate',
    description:
      'Create posts, captions, code, prompts, docs, emails, and summaries with one click.',
  },
  {
    icon: '🔍',
    title: 'Analyze',
    description:
      'Summarize, explain, review, extract data, or detect sentiment from any content.',
  },
];
