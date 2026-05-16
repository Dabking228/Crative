'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getApplicationStatus } from '../../../../lib/api';
import styles from '../../../roles.module.css';

const PROGRESS_MAP: Record<string, number> = {
    submitted: 10,
    ocr_complete: 20,
    eligible: 30,
    rejected: 30,
    interview_pending: 45,
    interview_complete: 60,
    judging: 75,
    awaiting_verdict: 88,
    approved: 100,
    declined: 100,
};

const STATUS_COLOR: Record<string, string> = {
    approved: '#2ed573',
    declined: '#ff4757',
    rejected: '#ff4757',
    awaiting_verdict: '#ffa502',
    judging: '#a29bfe',
    interview_pending: '#25d9ff',
    interview_complete: '#a29bfe',
    submitted: 'rgba(255,255,255,0.6)',
    ocr_complete: 'rgba(255,255,255,0.6)',
    eligible: '#25d9ff',
};

const STATUS_LABEL: Record<string, string> = {
    submitted: 'Submitted — document processing in progress',
    ocr_complete: 'Documents processed — eligibility screening queued',
    eligible: 'Eligibility screening complete',
    rejected: 'Rejected at eligibility screening',
    interview_pending: 'Interview questions ready — please complete your interview',
    interview_complete: 'Interview submitted — awaiting judge panel',
    judging: 'Under review by judge panel (AI + human)',
    awaiting_verdict: 'Judge panel review complete — awaiting final verdict',
    approved: 'Approved — enrolled in programme',
    declined: 'Application declined',
};

type StatusData = {
    application_id: string;
    status: string;
    eligibility_result: string | null;
    eligibility_reasoning: string;
    eligibility_flags: string[];
    eligibility_confidence: number | null;
    programme_recommended: string | null;
    startup_name: string | null;
    sector: string | null;
};

export default function ApplicationStatusPage() {
    const [inputId, setInputId] = useState('');
    const [data, setData] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLookup() {
        const id = inputId.trim();
        if (!id) return;
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await getApplicationStatus(id);
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Application not found');
        } finally {
            setLoading(false);
        }
    }

    const progress = data ? (PROGRESS_MAP[data.status] ?? 50) : 0;
    const statusColor = data ? (STATUS_COLOR[data.status] ?? 'rgba(255,255,255,0.5)') : '#25d9ff';

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Application Status</p>
                <h1 className={styles.pageTitle}>Track your submission</h1>
                <p className={styles.pageSubtitle}>
                    Enter your application ID to see the current stage, eligibility result, and next steps.
                </p>
            </section>

            <section className={styles.panel}>
                <p className={styles.fieldLabel}>Application ID</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                        className={styles.fieldInput}
                        type="text"
                        placeholder="e.g. APPDEMO001 or APP3F2A1B2C"
                        value={inputId}
                        onChange={(e) => setInputId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={loading || !inputId.trim()}
                        className={styles.primaryButton}
                        style={{ opacity: loading || !inputId.trim() ? 0.5 : 1, cursor: loading || !inputId.trim() ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? 'Checking…' : 'Check Status'}
                    </button>
                </div>
                {error && (
                    <p style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '10px' }}>{error}</p>
                )}
            </section>

            {data && (
                <>
                    <section className={styles.panel}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                            <div>
                                <h2 className={styles.sectionTitle} style={{ marginBottom: '4px' }}>
                                    {data.startup_name ?? data.application_id}
                                </h2>
                                {data.sector && (
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{data.sector}</span>
                                )}
                            </div>
                            <span style={{
                                padding: '5px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
                                background: statusColor + '1a', color: statusColor,
                            }}>
                                {data.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className={styles.progressTrack} style={{ marginBottom: '8px' }}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${progress}%`,
                                    background: data.status === 'approved'
                                        ? 'linear-gradient(90deg, #2ed573, #26ae60)'
                                        : data.status === 'declined' || data.status === 'rejected'
                                            ? 'linear-gradient(90deg, #ff4757, #c0392b)'
                                            : undefined,
                                    transition: 'width 0.6s ease',
                                }}
                            />
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 16px' }}>
                            {STATUS_LABEL[data.status] ?? data.status}
                        </p>

                        {data.eligibility_result && (
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>
                                    Eligibility:
                                </span>
                                <EligibilityChip result={data.eligibility_result} confidence={data.eligibility_confidence} />
                            </div>
                        )}

                        {data.programme_recommended && (
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                Programme: <strong style={{ color: '#25d9ff' }}>{data.programme_recommended}</strong>
                            </p>
                        )}

                        {data.eligibility_flags && data.eligibility_flags.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Flags raised:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {data.eligibility_flags.map((flag) => (
                                        <span key={flag} style={{
                                            padding: '3px 9px', borderRadius: '999px', fontSize: '0.74rem',
                                            background: 'rgba(255,165,2,0.1)', color: '#ffa502',
                                        }}>{flag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <Link
                                href={`/startup/progress?id=${data.application_id}`}
                                style={{
                                    display: 'inline-block', padding: '9px 16px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
                                    color: '#021226', fontWeight: 700, textDecoration: 'none', fontSize: '0.86rem',
                                }}
                            >
                                View Full Progress →
                            </Link>
                        </div>
                    </section>
                </>
            )}
        </>
    );
}

function EligibilityChip({ result, confidence }: { result: string; confidence?: number | null }) {
    const map: Record<string, { color: string }> = {
        PASS: { color: '#2ed573' },
        FAIL: { color: '#ff4757' },
        MANUAL_REVIEW: { color: '#ffa502' },
    };
    const s = map[result] ?? { color: 'rgba(255,255,255,0.4)' };
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 600,
            background: s.color + '1a', color: s.color,
        }}>
            {result}{confidence != null ? ` · ${(confidence * 100).toFixed(0)}%` : ''}
        </span>
    );
}
