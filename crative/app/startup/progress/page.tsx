'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getJudgeDetail } from '../../../lib/api';
import MilestoneTracker from '../../../components/MilestoneTracker';
import type { ApplicationDetail, Mentor } from '../../../lib/types';

const DEMO_MILESTONES = [
  { id: 'M1', name: 'MVP Launch', description: 'Core product features deployed. Demonstrate user registration, core workflow, and basic reporting.', status: 'pending' as const },
  { id: 'M2', name: 'First 10 Paying Customers', description: 'Show evidence of 10 active paying customers, invoices, and recurring transactions.', status: 'pending' as const },
  { id: 'M3', name: 'RM 50K MRR', description: 'Monthly recurring revenue of RM 50,000. Show dashboard with MRR metrics and payment records.', status: 'pending' as const },
];

function ProgressContent() {
  const params = useSearchParams();
  const applicationId = params.get('id') ?? '';
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    getJudgeDetail(applicationId)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (!applicationId) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
        No application ID provided. Please add <code>?id=APP...</code> to the URL.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 20px 60px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}>Loading…</div>
      ) : error ? (
        <div style={{ color: '#ff4757', padding: '20px' }}>{error}</div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px', padding: '24px', marginBottom: '24px',
          }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.3rem' }}>{detail?.startup_name ?? applicationId}</h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {detail?.sector && <Badge color="#25d9ff">{detail.sector}</Badge>}
              {detail?.stage && <Badge color="#534AB7">{detail.stage}</Badge>}
              {detail?.programme_applied && <Badge color="#0F6E56">{detail.programme_applied}</Badge>}
              <StatusBadge status={detail?.status ?? ''} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              Application ID: <code style={{ color: '#25d9ff' }}>{applicationId}</code>
            </div>
          </div>

          {/* Milestone tracker */}
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>
            Milestones
          </h2>
          <MilestoneTracker applicationId={applicationId} milestones={DEMO_MILESTONES} />

          {/* Matched mentors */}
          {detail?.matched_mentors && detail.matched_mentors.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                Matched Mentors
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {detail.matched_mentors.map((m: Mentor) => (
                  <MentorCard key={m.id} mentor={m} />
                ))}
              </div>
            </div>
          )}

          {/* Interview Q&A */}
          {detail?.interview_qa && detail.interview_qa.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                Interview Q&A
              </h2>
              {detail.interview_qa.map((qa, i) => (
                <div key={i} style={{
                  background: 'rgba(32,38,56,0.6)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '16px', marginBottom: '10px',
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#25d9ff', marginBottom: '6px' }}>Q{i + 1}</div>
                  <div style={{ fontSize: '0.88rem', marginBottom: '10px' }}>{qa.question}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Answer:</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{qa.answer || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function StartupProgressPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: 'white' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 5vw',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ← Cradle Portal
        </Link>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Startup Progress</span>
      </nav>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>}>
        <ProgressContent />
      </Suspense>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
      background: color + '1a', color: color, border: `1px solid ${color}33`,
    }}>{children}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    awaiting_verdict: { color: '#ffa502', label: 'Awaiting Verdict' },
    approved: { color: '#2ed573', label: 'Approved' },
    declined: { color: '#ff4757', label: 'Declined' },
    manual_review: { color: '#25d9ff', label: 'Manual Review' },
    rejected: { color: '#888', label: 'Rejected' },
    interview_pending: { color: '#25d9ff', label: 'Interview Pending' },
    judging: { color: '#a29bfe', label: 'Judging' },
  };
  const s = map[status] ?? { color: 'rgba(255,255,255,0.4)', label: status };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem',
      background: s.color + '1a', color: s.color,
    }}>{s.label}</span>
  );
}

function MentorCard({ mentor }: { mentor: Mentor }) {
  return (
    <div style={{
      background: 'rgba(15,110,86,0.1)', border: '1px solid rgba(15,110,86,0.3)',
      borderRadius: '14px', padding: '16px',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.92rem' }}>{mentor.name}</div>
      <div style={{ fontSize: '0.78rem', color: '#25d9ff', marginBottom: '8px' }}>{mentor.expertise}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {mentor.sectors?.map((s) => (
          <span key={s} style={{
            padding: '2px 7px', borderRadius: '999px', fontSize: '0.7rem',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}
