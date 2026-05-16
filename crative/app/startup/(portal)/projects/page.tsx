'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getJudgeQueue } from '../../../../lib/api';
import type { ApplicationQueueItem } from '../../../../lib/types';
import styles from '../../../roles.module.css';

const STATUS_COLOR: Record<string, string> = {
    approved: '#2ed573',
    declined: '#ff4757',
    rejected: '#888',
    awaiting_verdict: '#ffa502',
    judging: '#a29bfe',
    interview_pending: '#25d9ff',
    interview_complete: '#a29bfe',
    submitted: 'rgba(255,255,255,0.5)',
    ocr_complete: 'rgba(255,255,255,0.5)',
};

const STATUS_LABEL: Record<string, string> = {
    submitted: 'Submitted',
    ocr_complete: 'Processing',
    eligible: 'Eligible',
    rejected: 'Rejected',
    interview_pending: 'Interview Pending',
    interview_complete: 'Interview Done',
    judging: 'Under Review',
    awaiting_verdict: 'Awaiting Verdict',
    approved: 'Approved',
    declined: 'Declined',
};

export default function StartupProjectsPage() {
    const [items, setItems] = useState<ApplicationQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getJudgeQueue()
            .then((d) => setItems(d.applications))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Projects</p>
                <h1 className={styles.pageTitle}>Active programme applications</h1>
                <p className={styles.pageSubtitle}>
                    All applications currently in the Cradle ecosystem. Track progress or submit a new application.
                </p>
            </section>

            <section className={styles.panel}>
                {loading ? (
                    <p className={styles.sectionText}>Loading applications…</p>
                ) : error ? (
                    <p style={{ color: '#ff4757' }}>{error}</p>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p className={styles.sectionText} style={{ marginBottom: '16px' }}>
                            No applications submitted yet.
                        </p>
                        <Link href="/startup/apply" style={ctaStyle}>
                            Submit your first application →
                        </Link>
                    </div>
                ) : (
                    <div className={styles.gridTwo}>
                        {items.map((item) => (
                            <Link
                                key={item.application_id}
                                href={`/startup/progress?id=${item.application_id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <article
                                    className={styles.statCard}
                                    style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,217,255,0.4)')}
                                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)')}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <h2 className={styles.sectionTitle} style={{ margin: 0, fontSize: '0.95rem' }}>
                                            {item.startup_name}
                                        </h2>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
                                            borderRadius: '999px',
                                            color: STATUS_COLOR[item.status] ?? 'rgba(255,255,255,0.4)',
                                            background: (STATUS_COLOR[item.status] ?? 'rgba(255,255,255,0.4)') + '1a',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {STATUS_LABEL[item.status] ?? item.status}
                                        </span>
                                    </div>
                                    <p className={styles.newsletterMeta}>{item.programme_applied}</p>
                                    <p className={styles.sectionText} style={{ fontSize: '0.83rem', marginTop: '4px' }}>
                                        {item.sector} · {item.stage}
                                    </p>
                                    <p className={styles.newsletterMeta} style={{ marginTop: '8px' }}>
                                        Submitted {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}
                                    </p>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

const ctaStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
    color: '#021226',
    fontWeight: 700,
    textDecoration: 'none',
    fontSize: '0.88rem',
};
