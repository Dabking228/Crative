'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJudgeQueue } from '../../../../lib/api';
import type { ApplicationQueueItem } from '../../../../lib/types';
import styles from '../../../roles.module.css';

const PENDING_STATUSES = new Set([
    'submitted', 'ocr_complete', 'eligible',
    'interview_pending', 'interview_complete', 'judging', 'awaiting_verdict',
]);

const STATUS_LABEL: Record<string, string> = {
    submitted: 'Initial Screening',
    ocr_complete: 'Document Processing',
    eligible: 'Eligibility Check',
    interview_pending: 'Interview Pending',
    interview_complete: 'Interview Complete',
    judging: 'Panel Review',
    awaiting_verdict: 'Awaiting Verdict',
};

export default function PendingProjectsPage() {
    const router = useRouter();
    const [items, setItems] = useState<ApplicationQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getJudgeQueue()
            .then((d) => setItems(d.applications.filter((a) => PENDING_STATUSES.has(a.status))))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const byProgramme = items.reduce<Record<string, ApplicationQueueItem[]>>((acc, item) => {
        const prog = item.programme_applied || 'Unknown';
        if (!acc[prog]) acc[prog] = [];
        acc[prog].push(item);
        return acc;
    }, {});

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Pending Projects</p>
                <h1 className={styles.pageTitle}>Applications awaiting judge action</h1>
                <p className={styles.pageSubtitle}>
                    Startup applications grouped by programme. Click any row to open the full review panel.
                </p>
            </section>

            {loading ? (
                <section className={styles.panel}>
                    <p className={styles.sectionText}>Loading…</p>
                </section>
            ) : error ? (
                <section className={styles.panel}>
                    <p style={{ color: '#ff4757' }}>{error}</p>
                </section>
            ) : items.length === 0 ? (
                <section className={styles.panel}>
                    <p className={styles.sectionText}>No pending applications at this time.</p>
                </section>
            ) : (
                Object.entries(byProgramme).map(([programme, apps]) => (
                    <section className={styles.panel} key={programme}>
                        <h2 className={styles.sectionTitle}>{programme}</h2>
                        <div className={styles.tableWrap}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Startup</th>
                                        <th>Sector</th>
                                        <th>Screening Stage</th>
                                        <th>Eligibility</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apps.map((item) => (
                                        <tr
                                            key={item.application_id}
                                            onClick={() => router.push(`/judge/${item.application_id}`)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ fontWeight: 600 }}>{item.startup_name}</td>
                                            <td>{item.sector}</td>
                                            <td>
                                                <span className={styles.statusChip}>
                                                    {STATUS_LABEL[item.status] ?? item.status}
                                                </span>
                                            </td>
                                            <td>
                                                {item.eligibility_result ? (
                                                    <EligibilityChip result={item.eligibility_result} />
                                                ) : '—'}
                                            </td>
                                            <td>{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ))
            )}
        </>
    );
}

function EligibilityChip({ result }: { result: string }) {
    const map: Record<string, { color: string }> = {
        PASS: { color: '#2ed573' },
        FAIL: { color: '#ff4757' },
        MANUAL_REVIEW: { color: '#ffa502' },
    };
    const s = map[result] ?? { color: 'rgba(255,255,255,0.4)' };
    return (
        <span style={{
            display: 'inline-block', padding: '3px 9px', borderRadius: '999px',
            fontSize: '0.75rem', fontWeight: 600,
            background: s.color + '1a', color: s.color,
        }}>
            {result}
        </span>
    );
}
