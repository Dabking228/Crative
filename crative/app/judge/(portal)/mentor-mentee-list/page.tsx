'use client';

import { useEffect, useState } from 'react';
import { getEcosystemGraph } from '../../../../lib/api';
import type { GraphNode, GraphLink } from '../../../../lib/types';
import styles from '../../../roles.module.css';

interface AssignedCohort {
    startupName: string;
    startupId: string;
    mentorNames: string[];
    programme: string;
}

interface AvailableMentor {
    id: string;
    name: string;
    expertise: string;
    country: string;
}

export default function MentorMenteeListPage() {
    const [cohorts, setCohorts] = useState<AssignedCohort[]>([]);
    const [mentors, setMentors] = useState<AvailableMentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getEcosystemGraph()
            .then((data) => {
                const mentorNodes = data.nodes.filter((n: GraphNode) => n.label === 'Mentor');
                const startupNodes = data.nodes.filter((n: GraphNode) => n.label === 'Startup');
                const matchedLinks = data.links.filter((l: GraphLink) => l.type === 'MATCHED_TO');

                const startupMentorMap = new Map<string, string[]>();
                for (const link of matchedLinks) {
                    const mentorNode = mentorNodes.find((m: GraphNode) => m.id === link.target);
                    if (mentorNode) {
                        const existing = startupMentorMap.get(link.source) ?? [];
                        startupMentorMap.set(link.source, [...existing, mentorNode.name]);
                    }
                }

                const enrolledLinks = data.links.filter((l: GraphLink) => l.type === 'ENROLLED_IN');
                const startupProgrammeMap = new Map<string, string>();
                for (const link of enrolledLinks) {
                    const programmeNode = data.nodes.find((n: GraphNode) => n.id === link.target);
                    if (programmeNode) startupProgrammeMap.set(link.source, programmeNode.name);
                }

                const assigned: AssignedCohort[] = [];
                for (const [startupId, mentorNames] of startupMentorMap.entries()) {
                    const startupNode = startupNodes.find((s: GraphNode) => s.id === startupId);
                    if (startupNode) {
                        assigned.push({
                            startupId,
                            startupName: startupNode.name,
                            mentorNames,
                            programme: startupProgrammeMap.get(startupId) ?? '—',
                        });
                    }
                }

                setCohorts(assigned);
                setMentors(
                    mentorNodes.map((m: GraphNode) => ({
                        id: m.id,
                        name: m.name,
                        expertise: String(m.properties?.expertise ?? '—'),
                        country: String(m.properties?.country ?? 'MY'),
                    }))
                );
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Mentor-Mentee List</p>
                <h1 className={styles.pageTitle}>Track matched cohorts and mentor capacity</h1>
                <p className={styles.pageSubtitle}>
                    Live data from the Neo4j ecosystem graph — approved startups with their assigned mentors.
                </p>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Assigned Programme Cohorts</h2>
                {loading ? (
                    <p className={styles.sectionText}>Loading graph data…</p>
                ) : error ? (
                    <p style={{ color: '#ff4757' }}>{error}</p>
                ) : cohorts.length === 0 ? (
                    <p className={styles.sectionText}>No mentor-startup matches found yet. Approve applications to create matches.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Startup</th>
                                    <th>Programme</th>
                                    <th>Assigned Mentors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohorts.map((item) => (
                                    <tr key={item.startupId}>
                                        <td style={{ fontWeight: 600 }}>{item.startupName}</td>
                                        <td>{item.programme}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {item.mentorNames.map((name) => (
                                                    <span key={name} className={styles.statusChip}>{name}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Available Mentors</h2>
                {loading ? (
                    <p className={styles.sectionText}>Loading…</p>
                ) : mentors.length === 0 ? (
                    <p className={styles.sectionText}>No mentors in the ecosystem yet.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Mentor</th>
                                    <th>Expertise</th>
                                    <th>Country</th>
                                    <th>Matched Startups</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mentors.map((mentor) => {
                                    const matched = cohorts.filter((c) => c.mentorNames.includes(mentor.name)).length;
                                    return (
                                        <tr key={mentor.id}>
                                            <td style={{ fontWeight: 600 }}>{mentor.name}</td>
                                            <td>{mentor.expertise}</td>
                                            <td>{mentor.country}</td>
                                            <td>
                                                <span className={styles.statusChip}>
                                                    {matched} {matched === 1 ? 'startup' : 'startups'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}
