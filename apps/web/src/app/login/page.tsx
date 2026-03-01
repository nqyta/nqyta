'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem('eral_api_key');
    if (existing) router.replace('/chat');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Please enter your API key.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('https://eral.wokspec.org/api/v1/status', {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (res.status === 401) {
        setError('Invalid API key. Please check and try again.');
        setIsSubmitting(false);
        return;
      }
      localStorage.setItem('eral_api_key', trimmed);
      router.push('/chat');
    } catch {
      // Accept the key even if status check fails (network issue)
      localStorage.setItem('eral_api_key', trimmed);
      router.push('/chat');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '1.25rem',
          padding: '2.5rem 2rem',
          width: '100%',
          maxWidth: '24rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              background: 'var(--accent)',
              borderRadius: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.375rem',
              color: '#fff',
              margin: '0 auto 1rem',
            }}
          >
            E
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.375rem',
              color: 'var(--foreground)',
              marginBottom: '0.375rem',
            }}
          >
            Sign in to Eral
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Enter your Eral API key to continue.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label
              htmlFor="apiKey"
              style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--foreground)' }}
            >
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="eral_..."
              autoFocus
              style={{
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'var(--border)'}`,
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                fontFamily: 'ui-monospace, Menlo, monospace',
                outline: 'none',
                width: '100%',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'var(--border)';
              }}
            />
            {error && (
              <p style={{ fontSize: '0.8125rem', color: '#f87171', margin: 0 }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? 'var(--border)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'background 0.15s',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
          Your API key is stored locally and never sent to third parties.
        </p>
      </div>
    </div>
  );
}
