'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJudgeQueue } from '../../../lib/api';
import type { ApplicationQueueItem, EligibilityResult } from '../../../lib/types';

export default function JudgeQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  useEffect(() => {
    getJudgeQueue()
      .then((d) => setItems(d.applications))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (sectorFilter && item.sector !== sectorFilter) return false;
    return true;
  });

  const sectors = Array.from(new Set(items.map((i) => i.sector).filter(Boolean)));
  const statuses = Array.from(new Set(items.map((i) => i.status).filter(Boolean)));

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: 'white' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 5vw',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <Link href="/judge" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ← Back
        </Link>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/judge/graph" style={{
            padding: '6px 14px', borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(11,14,24,0.5)', color: '#f8f8f8',
            textDecoration: 'none', fontSize: '0.82rem',
          }}>
            Ecosystem Graph
          </Link>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Judge Portal</span>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 20px 60px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem' }}>Application Queue</h1>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem' }}>
          {items.length} application{items.length !== 1 ? 's' : ''} — click any row to review
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(statusFilter || sectorFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setSectorFilter(''); }}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '999px', color: 'rgba(255,255,255,0.6)',
                padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: '20px', color: '#ff4757' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            background: 'rgba(32,38,56,0.5)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', marginBottom: '12px' }}>
              {items.length === 0 ? 'No applications yet.' : 'No applications match the current filters.'}
            </div>
            {items.length === 0 && (
              <Link href="/startup/apply" style={{ color: '#25d9ff', fontSize: '0.85rem' }}>
                Submit the first application →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: 'rgba(2,8,18,0.85)' }}>
                  {['Startup Name', 'Sector', 'Stage', 'Programme', 'Submitted', 'Eligibility', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.9px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.application_id}
                    onClick={() => router.push(`/judge/${item.application_id}`)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 14px', fontWeight: 600, fontSize: '0.9rem' }}>{item.startup_name}</td>
                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{item.sector}</td>
                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{item.stage}</td>
                    <td style={{ padding: '14px 14px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{item.programme_applied}</td>
                    <td style={{ padding: '14px 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      {item.eligibility_result ? <EligibilityBadge result={item.eligibility_result} /> : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EligibilityBadge({ result }: { result: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    PASS: { color: '#2ed573', bg: 'rgba(46,213,115,0.12)' },
    FAIL: { color: '#ff4757', bg: 'rgba(255,71,87,0.12)' },
    MANUAL_REVIEW: { color: '#ffa502', bg: 'rgba(255,165,2,0.12)' },
  };
  const s = map[result] ?? { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{result}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    awaiting_verdict: { color: '#ffa502', bg: 'rgba(255,165,2,0.1)' },
    approved: { color: '#2ed573', bg: 'rgba(46,213,115,0.1)' },
    declined: { color: '#ff4757', bg: 'rgba(255,71,87,0.1)' },
    manual_review: { color: '#25d9ff', bg: 'rgba(37,217,255,0.1)' },
    rejected: { color: '#888', bg: 'rgba(255,255,255,0.06)' },
    interview_pending: { color: '#25d9ff', bg: 'rgba(37,217,255,0.1)' },
    interview_complete: { color: '#a29bfe', bg: 'rgba(162,155,254,0.1)' },
    judging: { color: '#a29bfe', bg: 'rgba(162,155,254,0.1)' },
    submitted: { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' },
  };
  const s = map[status] ?? { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '999px', fontSize: '0.75rem',
      background: s.bg, color: s.color,
    }}>{status.replace(/_/g, ' ')}</span>
  );
}

const filterSelectStyle: React.CSSProperties = {
  background: 'rgba(18,22,38,0.95)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '999px', color: 'white',
  padding: '6px 14px', fontSize: '0.8rem', outline: 'none',
  cursor: 'pointer',
};
