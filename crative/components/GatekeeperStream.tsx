'use client';

import { useEffect, useRef, useState } from 'react';
import { streamGatekeeper } from '../lib/api';
import type { SSEToken, EligibilityResult } from '../lib/types';

interface Props {
  applicationId: string;
  onComplete: (result: SSEToken['result']) => void;
}

export default function GatekeeperStream({ applicationId, onComplete }: Props) {
  const [tokens, setTokens] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = streamGatekeeper(
      applicationId,
      (token) => setTokens((prev) => prev + token),
      (result) => {
        setDone(true);
        onComplete(result);
      },
      (err) => setError(err.message)
    );
    return close;
  }, [applicationId, onComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tokens]);

  return (
    <div style={{
      background: 'rgba(2, 8, 18, 0.85)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '16px',
      padding: '20px',
      fontFamily: 'var(--font-geist-mono, monospace)',
      fontSize: '0.82rem',
      lineHeight: '1.65',
      color: 'rgba(255,255,255,0.85)',
      maxHeight: '420px',
      overflowY: 'auto',
      position: 'relative',
    }}>
      <div style={{
        fontSize: '0.7rem',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: '#25d9ff',
        marginBottom: '12px',
        fontFamily: 'var(--font-geist-sans, sans-serif)',
      }}>
        ▸ Eligibility Check in Progress
      </div>

      {error ? (
        <div style={{ color: '#ff4757' }}>Error: {error}</div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {tokens}
          {!done && (
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '14px',
              background: '#25d9ff',
              marginLeft: '2px',
              animation: 'blink 1s step-end infinite',
              verticalAlign: 'text-bottom',
            }} />
          )}
        </div>
      )}
      <div ref={bottomRef} />

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
