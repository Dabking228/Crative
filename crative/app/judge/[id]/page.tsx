'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getJudgeDetail, submitVerdict } from '../../../lib/api';
import ConsensusTable from '../../../components/ConsensusTable';
import OverrideModal from '../../../components/OverrideModal';
import type { ApplicationDetail, Mentor, Verdict } from '../../../lib/types';

export default function JudgeDetailPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerdict, setPendingVerdict] = useState<Verdict | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verdictResult, setVerdictResult] = useState<{ verdict: Verdict; alignmentScore: number; mentors: Mentor[] } | null>(null);
  const [showInterviewQA, setShowInterviewQA] = useState(false);

  useEffect(() => {
    getJudgeDetail(applicationId)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const majorityRec = detail?.consolidated_analysis?.majority_ai_recommendation ?? 'UNAVAILABLE';
  const isOverride = pendingVerdict && pendingVerdict !== majorityRec && majorityRec !== 'UNAVAILABLE' && majorityRec !== 'NEEDS_MORE_INFO';

  async function doVerdict(verdict: Verdict, overrideReason?: string) {
    setSubmitting(true);
    try {
      const res = await submitVerdict(applicationId, {
        verdict,
        override_reason: overrideReason,
      });
      setVerdictResult({ verdict, alignmentScore: res.alignment_score, mentors: res.matched_mentors });
      setDetail((prev) => prev ? { ...prev, judge_verdict: verdict, status: verdict === 'APPROVE' ? 'approved' : 'declined' } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verdict submission failed');
    } finally {
      setSubmitting(false);
      setPendingVerdict(null);
    }
  }

  function handleVerdictClick(v: Verdict) {
    if (isOverride) {
      setPendingVerdict(v);
    } else {
      setPendingVerdict(null);
      doVerdict(v);
    }
  }

  if (loading) return <PageShell><div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading…</div></PageShell>;
  if (error && !detail) return <PageShell><div style={{ color: '#ff4757', padding: '24px' }}>{error}</div></PageShell>;

  return (
    <PageShell>
      {/* Header */}
      <div style={{
        background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px', padding: '24px', marginBottom: '20px',
      }}>
        <h1 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>{detail?.startup_name}</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {detail?.sector && <Badge color="#25d9ff">{detail.sector}</Badge>}
          {detail?.stage && <Badge color="#534AB7">{detail.stage}</Badge>}
          {detail?.programme_applied && <Badge color="#0F6E56">{detail.programme_applied}</Badge>}
          {detail?.eligibility_result && <EligibilityBadge result={detail.eligibility_result} confidence={detail.eligibility_confidence} />}
        </div>
        {detail?.eligibility_flags && detail.eligibility_flags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {detail.eligibility_flags.map((flag, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem',
                background: 'rgba(255,165,2,0.1)', color: '#ffa502',
              }}>{flag}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          Submitted: {detail?.submitted_at ? new Date(detail.submitted_at).toLocaleString() : '—'}
          &nbsp;&nbsp;·&nbsp;&nbsp;ID: <code style={{ color: '#25d9ff' }}>{applicationId}</code>
        </div>
      </div>

      {/* Consensus Table */}
      {detail?.consolidated_analysis ? (
        <div style={{
          background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px', padding: '24px', marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            AI Consensus Analysis
          </h2>
          <ConsensusTable analysis={detail.consolidated_analysis} />
        </div>
      ) : (
        <div style={{
          background: 'rgba(32,38,56,0.5)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '28px', textAlign: 'center',
          color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {detail?.status === 'interview_pending' || detail?.status === 'interview_complete'
            ? 'Judging panel analysis in progress — waiting for interview answers to be submitted.'
            : 'Analysis not yet available for this application.'}
        </div>
      )}

      {/* Verdict section */}
      {!verdictResult && !detail?.judge_verdict ? (
        <div style={{
          background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px', padding: '24px', marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            Judge Verdict
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', margin: '0 0 20px' }}>
            Review the AI analysis above, then submit your verdict. If your decision differs from the AI majority recommendation, you will be asked to provide a written justification.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleVerdictClick('APPROVE')}
              disabled={submitting}
              style={{
                flex: 1, minWidth: '140px',
                background: submitting ? 'rgba(46,213,115,0.15)' : 'linear-gradient(135deg, #2ed573, #26ae60)',
                border: 'none', borderRadius: '12px',
                color: submitting ? 'rgba(255,255,255,0.4)' : '#fff',
                padding: '14px', cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
              }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => handleVerdictClick('DECLINE')}
              disabled={submitting}
              style={{
                flex: 1, minWidth: '140px',
                background: submitting ? 'rgba(255,71,87,0.15)' : 'linear-gradient(135deg, #ff4757, #c0392b)',
                border: 'none', borderRadius: '12px',
                color: submitting ? 'rgba(255,255,255,0.4)' : '#fff',
                padding: '14px', cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
              }}
            >
              ✗ Decline
            </button>
          </div>
          {submitting && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: '16px' }}>
              Recording verdict…
            </div>
          )}
        </div>
      ) : verdictResult ? (
        <VerdictConfirmation verdict={verdictResult.verdict} alignmentScore={verdictResult.alignmentScore} mentors={verdictResult.mentors} programme={detail?.programme_applied ?? ''} />
      ) : (
        <div style={{
          background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px', padding: '20px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>{detail?.judge_verdict === 'APPROVE' ? '✓' : '✗'}</span>
            <span style={{ fontWeight: 600 }}>Verdict already recorded: {detail?.judge_verdict}</span>
          </div>
        </div>
      )}

      {/* Interview Q&A collapsible */}
      {detail?.interview_qa && detail.interview_qa.length > 0 && (
        <div style={{
          background: 'rgba(32,38,56,0.6)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', marginBottom: '20px', overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowInterviewQA((v) => !v)}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: 'white', padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            <span>Interview Q&A ({detail.interview_qa.length} questions)</span>
            <span style={{ transform: showInterviewQA ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {showInterviewQA && (
            <div style={{ padding: '0 20px 20px' }}>
              {detail.interview_qa.map((qa, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
                  padding: '14px', marginBottom: '10px',
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#25d9ff', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Q{i + 1}</div>
                  <div style={{ fontSize: '0.88rem', marginBottom: '10px' }}>{qa.question}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Answer:</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{qa.answer || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override modal */}
      {isOverride && pendingVerdict && (
        <OverrideModal
          verdict={pendingVerdict}
          majorityRecommendation={majorityRec}
          onConfirm={(reason) => doVerdict(pendingVerdict, reason)}
          onCancel={() => setPendingVerdict(null)}
        />
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: 'white' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 5vw',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/judge/queue" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ← Queue
        </Link>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Judge Review</span>
      </nav>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 20px 60px' }}>
        {children}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
      background: color + '1a', color, border: `1px solid ${color}33`,
    }}>{children}</span>
  );
}

function EligibilityBadge({ result, confidence }: { result: string; confidence?: number | null }) {
  const map: Record<string, { color: string; bg: string }> = {
    PASS: { color: '#2ed573', bg: 'rgba(46,213,115,0.12)' },
    FAIL: { color: '#ff4757', bg: 'rgba(255,71,87,0.12)' },
    MANUAL_REVIEW: { color: '#ffa502', bg: 'rgba(255,165,2,0.12)' },
  };
  const s = map[result] ?? { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: s.bg, color: s.color }}>
      {result}{confidence != null ? ` ${(confidence * 100).toFixed(0)}%` : ''}
    </span>
  );
}

function VerdictConfirmation({ verdict, alignmentScore, mentors, programme }: { verdict: Verdict; alignmentScore: number; mentors: Mentor[]; programme: string }) {
  const isApprove = verdict === 'APPROVE';
  return (
    <div style={{
      background: isApprove ? 'rgba(46,213,115,0.08)' : 'rgba(255,71,87,0.08)',
      border: `1px solid ${isApprove ? 'rgba(46,213,115,0.3)' : 'rgba(255,71,87,0.3)'}`,
      borderRadius: '20px', padding: '28px', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.8rem' }}>{isApprove ? '✓' : '✗'}</span>
        <div>
          <h2 style={{ margin: 0, color: isApprove ? '#2ed573' : '#ff4757', fontSize: '1.15rem' }}>
            {isApprove ? 'Application Approved' : 'Application Declined'}
          </h2>
          <div style={{ marginTop: '4px', fontSize: '0.82rem', color: alignmentScore >= 0 ? '#25d9ff' : '#ffa502' }}>
            {alignmentScore >= 0 ? '🤝 AI Matched ✓' : '⚡ Human Override ✓'} (score: {alignmentScore > 0 ? '+1' : alignmentScore < 0 ? '−1' : '0'})
          </div>
        </div>
      </div>

      {isApprove && (
        <>
          {programme && (
            <div style={{ marginBottom: '16px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
              Enrolled in: <strong style={{ color: '#25d9ff' }}>{programme}</strong>
            </div>
          )}
          {mentors.length > 0 && (
            <>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                Matched Mentors
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {mentors.map((m) => (
                  <div key={m.id} style={{
                    background: 'rgba(15,110,86,0.12)', border: '1px solid rgba(15,110,86,0.25)',
                    borderRadius: '12px', padding: '14px',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{m.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#25d9ff', marginBottom: '6px' }}>{m.expertise}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {m.sectors?.map((s) => (
                        <span key={s} style={{ padding: '2px 6px', borderRadius: '999px', fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
