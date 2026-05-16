'use client';

import { useRef, useState } from 'react';
import { uploadMilestone, getMilestoneStatus, fileToBase64 } from '../../lib/api';
import type { MilestoneStatus } from '../../lib/types';

interface Milestone {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'submitted' | 'verified' | 'failed';
  result?: MilestoneStatus;
}

interface Props {
  applicationId: string;
  milestones: Milestone[];
}

export default function MilestoneTracker({ applicationId, milestones: initialMilestones }: Props) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(milestoneId: string, milestoneDesc: string, milestoneName: string, file: File) {
    setUploading(milestoneId);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadMilestone(applicationId, base64, milestoneDesc, milestoneName);
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId
            ? { ...m, status: result.milestone_passed ? 'verified' : 'failed', result }
            : m
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(null);
    }
  }

  function statusBadge(status: Milestone['status']) {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', label: 'Pending' },
      submitted: { bg: 'rgba(37,217,255,0.12)', color: '#25d9ff', label: 'Submitted' },
      verified: { bg: 'rgba(46,213,115,0.12)', color: '#2ed573', label: '✓ Verified' },
      failed: { bg: 'rgba(255,71,87,0.12)', color: '#ff4757', label: '✗ Failed' },
    };
    const s = styles[status];
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
        background: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: 600,
      }}>
        {s.label}
      </span>
    );
  }

  return (
    <div>
      {milestones.map((m, idx) => (
        <div key={m.id} style={{
          background: 'rgba(32,38,56,0.76)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '12px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: m.status === 'verified' ? '#2ed573' : 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                color: m.status === 'verified' ? '#021226' : 'rgba(255,255,255,0.6)',
              }}>
                {m.status === 'verified' ? '✓' : idx + 1}
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{m.name}</h3>
            </div>
            {statusBadge(m.status)}
          </div>

          <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
            {m.description}
          </p>

          {m.status === 'pending' && (
            <>
              <input
                ref={(el) => { fileInputs.current[m.id] = el; }}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(m.id, m.description, m.name, file);
                }}
              />
              <button
                onClick={() => fileInputs.current[m.id]?.click()}
                disabled={uploading === m.id}
                style={{
                  background: uploading === m.id ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #25d9ff, #1495ff)',
                  border: 'none', borderRadius: '10px',
                  color: uploading === m.id ? 'rgba(255,255,255,0.35)' : '#021226',
                  padding: '8px 16px', cursor: uploading === m.id ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '0.85rem',
                }}
              >
                {uploading === m.id ? 'Uploading…' : '↑ Upload Demo Video'}
              </button>
            </>
          )}

          {m.result && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
                Verification Checklist — {m.result.verified_count}/{m.result.total_count} criteria met
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(2,8,18,0.8)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.45)' }}>Criterion</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.45)', width: '80px' }}>Verified</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.45)' }}>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.result.checklist.map((item, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>{item.criterion}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '1rem' }}>
                          {item.verified ? '✓' : '✗'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>{item.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {m.result.manual_review_required && (
                <div style={{ marginTop: '10px', padding: '8px 14px', background: 'rgba(255,165,2,0.08)', border: '1px solid rgba(255,165,2,0.2)', borderRadius: '8px', fontSize: '0.82rem', color: '#ffa502' }}>
                  ⚠ Manual review required — video evidence was ambiguous
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
