'use client';

import { useState } from 'react';
import type { ConsolidatedAnalysis, DimensionScore } from '../lib/types';

const DIMENSIONS = [
  { key: 'strengths', label: 'Strengths' },
  { key: 'weaknesses', label: 'Weaknesses' },
  { key: 'market_value', label: 'Market Value' },
  { key: 'problem_statement', label: 'Problem Statement' },
  { key: 'business_model', label: 'Business Model' },
  { key: 'target_users', label: 'Target Users' },
  { key: 'judging_criteria', label: 'Judging Criteria' },
];

const MODELS = [
  { key: 'gemini', label: 'Gemini 3 Flash', provider: 'Google DeepMind' },
  { key: 'claude', label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { key: 'grok', label: 'Grok 4.20', provider: 'xAI' },
];

function scoreColor(score: number | null): string {
  if (score === null) return 'rgba(255,255,255,0.35)';
  if (score >= 8) return '#2ed573';
  if (score >= 5) return '#ffa502';
  return '#ff4757';
}

function scoreBg(score: number | null): string {
  if (score === null) return 'transparent';
  if (score >= 8) return 'rgba(46,213,115,0.08)';
  if (score >= 5) return 'rgba(255,165,2,0.08)';
  return 'rgba(255,71,87,0.08)';
}

function recommendationStyle(rec: string): { color: string; bg: string } {
  if (rec === 'APPROVE') return { color: '#2ed573', bg: 'rgba(46,213,115,0.12)' };
  if (rec === 'DECLINE') return { color: '#ff4757', bg: 'rgba(255,71,87,0.12)' };
  if (rec === 'NEEDS_MORE_INFO') return { color: '#ffa502', bg: 'rgba(255,165,2,0.12)' };
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };
}

interface SidePanelData {
  dimension: string;
  model: string;
  score: DimensionScore;
}

interface Props {
  analysis: ConsolidatedAnalysis;
}

export default function ConsensusTable({ analysis }: Props) {
  const [sidePanel, setSidePanel] = useState<SidePanelData | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      {/* Model recommendation header bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <div />
        {MODELS.map((m) => {
          const rec = analysis.model_recommendations?.[m.key];
          const style = recommendationStyle(rec?.recommendation ?? 'UNAVAILABLE');
          const majority = analysis.majority_ai_recommendation;
          return (
            <div key={m.key} style={{
              background: 'rgba(32,38,56,0.76)',
              border: rec?.recommendation === majority
                ? '2px solid rgba(37,217,255,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>{m.provider}</div>
              {rec?.error ? (
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.72rem',
                }}>Unavailable</span>
              ) : (
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
                  background: style.bg, color: style.color, fontSize: '0.72rem', fontWeight: 600,
                }}>
                  {rec?.recommendation ?? '—'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Majority recommendation */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Majority AI recommendation:</span>
        <span style={{
          ...recommendationStyle(analysis.majority_ai_recommendation),
          padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
        }}>
          {analysis.majority_ai_recommendation}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
          <thead>
            <tr style={{ background: 'rgba(2,8,18,0.8)' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.75rem', letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', width: '180px' }}>Dimension</th>
              {MODELS.map((m) => (
                <th key={m.key} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.75rem', letterSpacing: '0.9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map(({ key, label }) => {
              const dim = analysis.dimensions?.[key];
              const isHighVariance = dim?.high_variance;

              return (
                <tr key={key} style={{
                  background: isHighVariance ? 'rgba(255,165,2,0.06)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <td style={{ padding: '12px 14px', fontSize: '0.88rem', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isHighVariance && <span title="High variance between models" style={{ color: '#ffa502' }}>⚠</span>}
                      <span>{label}</span>
                    </div>
                    {isHighVariance && (
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,165,2,0.7)', marginTop: '2px' }}>
                        variance: {dim.score_variance}
                      </div>
                    )}
                  </td>

                  {MODELS.map((m) => {
                    const cell = dim?.[m.key as 'gemini' | 'claude' | 'grok'] as DimensionScore | undefined;
                    const score = cell?.score ?? null;

                    return (
                      <td
                        key={m.key}
                        onClick={() => cell && setSidePanel({ dimension: label, model: m.label, score: cell })}
                        style={{
                          padding: '10px 14px',
                          cursor: cell ? 'pointer' : 'default',
                          verticalAlign: 'top',
                          background: scoreBg(score),
                          transition: 'background 0.15s',
                        }}
                      >
                        {cell?.error || score === null ? (
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.88rem' }}>—</span>
                        ) : (
                          <>
                            <div style={{
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: scoreColor(score),
                              marginBottom: '4px',
                            }}>
                              {score}/10
                            </div>
                            <div style={{
                              fontSize: '0.78rem',
                              color: 'rgba(255,255,255,0.6)',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {cell?.reasoning?.slice(0, 80)}{(cell?.reasoning?.length ?? 0) > 80 ? '…' : ''}
                            </div>
                            {cell?.red_flags?.length > 0 && (
                              <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#ffa502' }}>
                                {cell.red_flags.length} flag{cell.red_flags.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Side panel */}
      {sidePanel && (
        <div
          onClick={() => setSidePanel(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(5,5,8,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: 'min(460px, 96vw)',
              background: 'rgba(18,22,38,0.98)',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              padding: '28px',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => setSidePanel(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'white', cursor: 'pointer', padding: '6px 12px', fontSize: '0.82rem',
              }}
            >
              ✕ Close
            </button>

            <div style={{ fontSize: '0.72rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#25d9ff', marginBottom: '6px' }}>
              {sidePanel.model}
            </div>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.05rem' }}>{sidePanel.dimension}</h3>

            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '999px',
              background: scoreBg(sidePanel.score.score),
              color: scoreColor(sidePanel.score.score),
              fontWeight: 700, fontSize: '1.15rem', marginBottom: '16px',
            }}>
              {sidePanel.score.score !== null ? `${sidePanel.score.score}/10` : '—'}
            </div>

            <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: '20px' }}>
              {sidePanel.score.reasoning || 'No reasoning provided.'}
            </div>

            {sidePanel.score.red_flags?.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#ff4757', marginBottom: '10px' }}>
                  Red Flags
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  {sidePanel.score.red_flags.map((flag, i) => (
                    <li key={i} style={{ marginBottom: '6px', lineHeight: 1.5 }}>{flag}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
