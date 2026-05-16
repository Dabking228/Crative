'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getJudgeQueue } from '../../../../lib/api';
import type { ApplicationQueueItem } from '../../../../lib/types';
import styles from '../../../roles.module.css';

export default function MentorMyStartupsPage() {
    const [items, setItems] = useState<ApplicationQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getJudgeQueue()
            .then((d) => setItems(d.applications.filter((a) => a.status === 'approved')))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className={styles.rolePage} style={{ paddingTop: 0 }}>
            <div style={{ width: 'min(1100px,92vw)', margin: '0 auto', padding: '40px 0 60px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ margin: '0 0 6px', fontSize: '1.4rem' }}>My Assigned Startups</h1>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem' }}>
                        All startups currently under your mentorship. Click View Roadmap to co-edit and track their development plan.
                    </p>
                </div>

                {loading ? (
                    <div style={{ color: 'rgba(255,255,255,0.35)', padding: '40px 0' }}>Loading…</div>
                ) : error ? (
                    <div style={{ color: '#ff4757' }}>{error}</div>
                ) : items.length === 0 ? (
                    <div className={styles.panel} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.35)' }}>
                        No startups assigned yet.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {items.map((item) => (
                            <div key={item.application_id} style={{
                                background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '18px', padding: '22px',
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                                    {item.startup_name ?? item.application_id}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                    {item.sector && <Chip color="#25d9ff">{item.sector}</Chip>}
                                    {item.programme_applied && <Chip color="#0F6E56">{item.programme_applied}</Chip>}
                                    <Chip color="#2ed573">Approved</Chip>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>
                                    ID: <code style={{ color: '#25d9ff' }}>{item.application_id}</code>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <Link
                                        href={`/mentor/roadmap?id=${item.application_id}`}
                                        style={{
                                            flex: 1, textAlign: 'center', padding: '9px 14px', borderRadius: '10px', textDecoration: 'none',
                                            background: 'linear-gradient(135deg,#25d9ff,#1495ff)', color: '#021226', fontWeight: 700, fontSize: '0.82rem',
                                        }}
                                    >
                                        View Roadmap
                                    </Link>
                                    <Link
                                        href={`/startup/progress?id=${item.application_id}`}
                                        style={{
                                            flex: 1, textAlign: 'center', padding: '9px 14px', borderRadius: '10px', textDecoration: 'none',
                                            border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem',
                                        }}
                                    >
                                        Progress
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <span style={{
            padding: '2px 9px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
            background: color + '1a', color, border: `1px solid ${color}33`,
        }}>{children}</span>
    );
}
