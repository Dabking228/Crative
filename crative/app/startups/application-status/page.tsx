import styles from '../../roles.module.css';

const applicationStatuses = [
    { programme: 'CIP Spark', stage: 'Initial Review', progress: 45, status: 'In Review' },
    { programme: 'CIP Sprint', stage: 'Document Validation', progress: 70, status: 'Action Needed' },
    { programme: 'Prototype Grant', stage: 'Mentor Matching', progress: 90, status: 'Almost Complete' },
];

export default function ApplicationStatusPage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Application Status</p>
                <h1 className={styles.pageTitle}>Track your submissions</h1>
                <p className={styles.pageSubtitle}>
                    Monitor each programme application stage and the latest action required from your team.
                </p>
            </section>

            <section className={styles.panel}>
                <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Programme</th>
                                <th>Current Stage</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applicationStatuses.map((item) => (
                                <tr key={item.programme}>
                                    <td>{item.programme}</td>
                                    <td>{item.stage}</td>
                                    <td>
                                        <div className={styles.progressTrack}>
                                            <div className={styles.progressFill} style={{ width: `${item.progress}%` }} />
                                        </div>
                                    </td>
                                    <td><span className={styles.statusChip}>{item.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
