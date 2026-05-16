'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJudgeQueue } from '../../../lib/api';
import type { ApplicationQueueItem } from '../../../lib/types';
import styles from '../../roles.module.css';

export default function MentorHomePage() {
    const [items, setItems] = useState<ApplicationQueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getJudgeQueue()
            .then((d) => setItems(d.applications))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const assigned = items.filter((a) => a.status === 'approved');
    const total = assigned.length;

    return (
        <div className={styles.rolePage} style={{ paddingTop: 0 }}>
            <div style={{ width: 'min(1100px,92vw)', margin: '0 auto', padding: '40px 0 60px' }}>

                {/* Hero */}
                <div className={styles.heroPanel} style={{ marginBottom: '24px' }}>
                    <h1 className={styles.heroTitle}>Welcome, Mentor</h1>
                    <p className={styles.heroSub}>
                        Guide the next generation of Malaysian startups. Review your assigned founders, co-build their development roadmaps, and track progress milestones.
                    </p>
                </div>

                {/* Stats */}
                <div className={styles.statGrid} style={{ marginBottom: '24px' }}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{loading ? '—' : total}</div>
                        <div className={styles.statLabel}>Assigned Startups</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{loading ? '—' : total}</div>
                        <div className={styles.statLabel}>Active Roadmaps</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>5</div>
                        <div className={styles.statLabel}>Available Mentors</div>
                    </div>
                </div>

                {/* Quick actions */}
                <div className={styles.panel} style={{ marginBottom: '20px' }}>
                    <h2 className={styles.sectionHeading}>Quick Actions</h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Link href="/mentor/my-startups" style={actionBtn}>
                            View My Startups
                        </Link>
                    </div>
                </div>

                {/* Recent assigned startups */}
                <div className={styles.panel}>
                    <h2 className={styles.sectionHeading}>Assigned Startups</h2>
                    {loading ? (
                        <div style={{ color: 'rgba(255,255,255,0.35)', padding: '20px 0' }}>Loading…</div>
                    ) : assigned.length === 0 ? (
                        <div style={{ color: 'rgba(255,255,255,0.35)', padding: '20px 0' }}>No startups assigned yet.</div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Startup</th>
                                        <th>Sector</th>
                                        <th>Programme</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assigned.slice(0, 5).map((item) => (
                                        <tr key={item.application_id}>
                                            <td>{item.startup_name ?? item.application_id}</td>
                                            <td>{item.sector ?? '—'}</td>
                                            <td>{item.programme_applied ?? '—'}</td>
                                            <td>
                                                <Link
                                                    href={`/mentor/roadmap?id=${item.application_id}`}
                                                    style={{ color: '#25d9ff', fontSize: '0.82rem', textDecoration: 'none' }}
                                                >
                                                    View Roadmap →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const actionBtn: React.CSSProperties = {
    padding: '10px 20px', borderRadius: '10px', textDecoration: 'none',
    background: 'rgba(37,217,255,0.1)', border: '1px solid rgba(37,217,255,0.25)',
    color: '#25d9ff', fontWeight: 600, fontSize: '0.88rem',
};
