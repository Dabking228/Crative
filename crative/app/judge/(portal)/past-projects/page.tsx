'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJudgeQueue } from '../../../../lib/api';
import type { ApplicationQueueItem } from '../../../../lib/types';
import styles from '../../../roles.module.css';

const TERMINAL_STATUSES = new Set(['approved', 'declined', 'rejected']);

export default function PastProjectsPage() {
    const router = useRouter();
    const [items, setItems] = useState<ApplicationQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getJudgeQueue()
            .then((d) => setItems(d.applications.filter((a) => TERMINAL_STATUSES.has(a.status))))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Past Projects</p>
                <h1 className={styles.pageTitle}>Completed projects repository</h1>
                <p className={styles.pageSubtitle}>
                    Archive of applications that have received a final verdict — approved, declined, or rejected at screening.
                </p>
            </section>

            <section className={styles.panel}>
                {loading ? (
                    <p className={styles.sectionText}>Loading…</p>
                ) : error ? (
                    <p style={{ color: '#ff4757' }}>{error}</p>
                ) : items.length === 0 ? (
                    <p className={styles.sectionText}>No completed projects yet.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Startup</th>
                                    <th>Sector</th>
                                    <th>Programme</th>
                                    <th>Submitted</th>
                                    <th>Outcome</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.application_id}
                                        onClick={() => router.push(`/judge/${item.application_id}`)}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ fontWeight: 600 }}>{item.startup_name}</td>
                                        <td>{item.sector}</td>
                                        <td>{item.programme_applied}</td>
                                        <td>{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}</td>
                                        <td><StatusChip status={item.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}

function StatusChip({ status }: { status: string }) {
    const map: Record<string, { color: string; label: string }> = {
        approved: { color: '#2ed573', label: 'Approved' },
        declined: { color: '#ff4757', label: 'Declined' },
        rejected: { color: '#888', label: 'Rejected at Screening' },
    };
    const s = map[status] ?? { color: 'rgba(255,255,255,0.4)', label: status };
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
            fontSize: '0.76rem', fontWeight: 600,
            background: s.color + '1a', color: s.color,
        }}>
            {s.label}
        </span>
    );
}
