'use client';

import { useState } from 'react';
import { submitInterview } from '../lib/api';

interface Props {
  applicationId: string;
  questions: string[];
  onComplete: () => void;
}

export default function InterviewPanel({ applicationId, questions, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAnswer = answers[currentIndex] ?? '';
  const isLast = currentIndex === questions.length - 1;

  function setAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = value;
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitInterview(applicationId, questions, answers);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      background: 'rgba(32,38,56,0.76)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '20px',
      padding: '28px',
    }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i < currentIndex
                ? '#25d9ff'
                : i === currentIndex
                  ? 'rgba(37,217,255,0.5)'
                  : 'rgba(255,255,255,0.15)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '2px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        marginBottom: '28px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${((currentIndex + 1) / questions.length) * 100}%`,
          background: 'linear-gradient(90deg, #25d9ff, #1495ff)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Question */}
      <div style={{
        background: 'rgba(37,217,255,0.05)',
        border: '1px solid rgba(37,217,255,0.2)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.92)',
      }}>
        {questions[currentIndex]}
      </div>

      {/* Answer */}
      <textarea
        value={currentAnswer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here…"
        rows={5}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '12px',
          color: 'white',
          padding: '14px',
          fontSize: '0.9rem',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          lineHeight: 1.6,
          marginBottom: '16px',
        }}
      />

      {error && (
        <div style={{ color: '#ff4757', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            color: currentIndex === 0 ? 'rgba(255,255,255,0.25)' : 'white',
            padding: '10px 18px',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.88rem',
          }}
        >
          ← Back
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !answers.every((a) => a.trim())}
            style={{
              background: (submitting || !answers.every((a) => a.trim()))
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #25d9ff, #1495ff)',
              border: 'none',
              borderRadius: '10px',
              color: (submitting || !answers.every((a) => a.trim())) ? 'rgba(255,255,255,0.35)' : '#021226',
              padding: '10px 22px',
              cursor: (submitting || !answers.every((a) => a.trim())) ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Answers →'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={!currentAnswer.trim()}
            style={{
              background: !currentAnswer.trim()
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #25d9ff, #1495ff)',
              border: 'none',
              borderRadius: '10px',
              color: !currentAnswer.trim() ? 'rgba(255,255,255,0.35)' : '#021226',
              padding: '10px 22px',
              cursor: !currentAnswer.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
            }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
