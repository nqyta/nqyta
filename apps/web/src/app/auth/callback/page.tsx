'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [message, setMessage] = useState('Completing sign in…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');

    if (!accessToken) {
      setStatus('error');
      setMessage('No access token received. Please try signing in again.');
      return;
    }

    // Store the WokSpec JWT as the Nqita token (Nqita Worker accepts WokSpec JWTs)
    localStorage.setItem('eral_token', accessToken);
    router.replace('/chat');
  }, [router]);

  return (
    <main className="app-auth-shell">
      <section className="app-auth-card" style={{ textAlign: 'center' }}>
        <div className="app-auth-mark">NQ</div>
        <h1 className="app-auth-title">{status === 'processing' ? 'Completing sign in' : 'Sign in failed'}</h1>
        <p className="app-auth-copy" style={{ color: status === 'processing' ? 'var(--muted)' : '#f3a5b6' }}>
          {message}
        </p>
        {status === 'processing' ? (
          <>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                margin: '18px auto 0',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        ) : (
          <div style={{ marginTop: '22px' }}>
            <a href="/login" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
              Back to sign in
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
