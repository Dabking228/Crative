import styles from '../../roles.module.css';

const pendingByProgramme = [
    {
        programme: 'CIP Spark',
        applications: [
            { startup: 'GreenByte Labs', project: 'Waste-to-Insight Platform', stage: 'Initial Screening', date: '2026-05-07' },
            { startup: 'NeuroNest', project: 'Cognitive Rehab Companion', stage: 'Panel Review', date: '2026-05-10' },
        ],
    },
    {
        programme: 'CIP Sprint',
        applications: [
            { startup: 'ThermaGrid', project: 'Cold Chain Monitoring', stage: 'Initial Screening', date: '2026-05-05' },
            { startup: 'AquaSignal', project: 'Aquaculture Risk Alerts', stage: 'Due Diligence', date: '2026-05-11' },
        ],
    },
];

export default function PendingProjectsPage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Pending Projects</p>
                <h1 className={styles.pageTitle}>Applications awaiting judge action</h1>
                <p className={styles.pageSubtitle}>
                    Review startup applications grouped by programme and prioritize evaluations.
                </p>
            </section>

            {pendingByProgramme.map((group) => (
                <section className={styles.panel} key={group.programme}>
                    <h2 className={styles.sectionTitle}>{group.programme}</h2>
                    <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Startup</th>
                                    <th>Project</th>
                                    <th>Screening Stage</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.applications.map((application) => (
                                    <tr key={`${group.programme}-${application.startup}`}>
                                        <td>{application.startup}</td>
                                        <td>{application.project}</td>
                                        <td><span className={styles.statusChip}>{application.stage}</span></td>
                                        <td>{application.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </>
    );
}
