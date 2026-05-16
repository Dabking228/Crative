'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getJudgeQueue } from '../../../lib/api';
import type { ApplicationQueueItem } from '../../../lib/types';
import styles from '../../roles.module.css';

const PENDING_STATUSES = new Set([
    'submitted', 'ocr_complete', 'eligible',
    'interview_pending', 'interview_complete', 'judging', 'awaiting_verdict',
]);

export default function JudgesHomePage() {
    const [items, setItems] = useState<ApplicationQueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getJudgeQueue()
            .then((d) => setItems(d.applications))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pending = items.filter((i) => PENDING_STATUSES.has(i.status)).length;
    const approved = items.filter((i) => i.status === 'approved').length;
    const declined = items.filter((i) => i.status === 'declined').length;
    const total = items.length;

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Cradle Judges Home</p>
                <h1 className={styles.pageTitle}>Programme evaluation dashboard</h1>
                <p className={styles.pageSubtitle}>
                    Review pipeline load, ongoing mentor assignments, and completed portfolio outcomes.
                </p>
            </section>

            <section className={styles.panel}>
                <div className={styles.statGrid}>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Pending Applications</p>
                        <p className={styles.statValue}>{loading ? '—' : pending}</p>
                    </article>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Approved</p>
                        <p className={styles.statValue}>{loading ? '—' : approved}</p>
                    </article>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Declined</p>
                        <p className={styles.statValue}>{loading ? '—' : declined}</p>
                    </article>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Total Applications</p>
                        <p className={styles.statValue}>{loading ? '—' : total}</p>
                    </article>
                </div>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <Link href="/judge/queue" style={actionLinkStyle}>
                        View Judge Queue →
                    </Link>
                    <Link href="/judge/pending-projects" style={actionLinkStyle}>
                        Pending Projects →
                    </Link>
                    <Link href="/judge/graph" style={{ ...actionLinkStyle, background: 'rgba(83,74,183,0.15)', borderColor: 'rgba(83,74,183,0.4)', color: '#a29bfe' }}>
                        Ecosystem Graph →
                    </Link>
                </div>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Judge Notes</h2>
                <ul className={styles.newsletterList}>
                    <li className={styles.newsletterItem}>
                        <h3 className={styles.newsletterTitle}>CIP Spark intake closes in 7 days</h3>
                        <p className={styles.newsletterMeta}>Assign two additional screeners to avoid bottlenecks.</p>
                    </li>
                    <li className={styles.newsletterItem}>
                        <h3 className={styles.newsletterTitle}>Mentor capacity alert</h3>
                        <p className={styles.newsletterMeta}>IoT and HealthTech cohorts need three more available mentors.</p>
                    </li>
                </ul>
            </section>
        </>
    );
}

const actionLinkStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '9px 16px',
    borderRadius: '10px',
    background: 'rgba(37,217,255,0.1)',
    border: '1px solid rgba(37,217,255,0.3)',
    color: '#25d9ff',
    textDecoration: 'none',
    fontSize: '0.86rem',
    fontWeight: 600,
};
