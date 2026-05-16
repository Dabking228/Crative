'use client';

import { useState } from 'react';

interface Props {
  verdict: 'APPROVE' | 'DECLINE';
  majorityRecommendation: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function OverrideModal({ verdict, majorityRecommendation, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length >= 20;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5,5,8,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(32,38,56,0.97)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '32px',
        width: 'min(500px, 96vw)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>⚠</span>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Human Override Required</h2>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: 1.55 }}>
          The AI panel recommended <strong style={{ color: '#ffa502' }}>{majorityRecommendation}</strong>, but you are choosing to <strong style={{ color: verdict === 'APPROVE' ? '#2ed573' : '#ff4757' }}>{verdict}</strong>. Please provide a written justification for the override (minimum 20 characters).
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you are overriding the AI recommendation…"
          rows={4}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '10px',
            color: 'white',
            padding: '12px',
            fontSize: '0.88rem',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />

        <div style={{
          fontSize: '0.75rem',
          color: reason.length >= 20 ? 'rgba(46,213,115,0.7)' : 'rgba(255,255,255,0.35)',
          marginTop: '6px',
          marginBottom: '20px',
        }}>
          {reason.length} / 20 characters minimum
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '10px',
              color: 'white',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onConfirm(reason.trim())}
            disabled={!canSubmit}
            style={{
              background: canSubmit
                ? (verdict === 'APPROVE' ? 'linear-gradient(135deg, #2ed573, #26ae60)' : 'linear-gradient(135deg, #ff4757, #c0392b)')
                : 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '10px',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.35)',
              padding: '10px 24px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '0.88rem',
            }}
          >
            Confirm {verdict}
          </button>
        </div>
      </div>
    </div>
  );
}
