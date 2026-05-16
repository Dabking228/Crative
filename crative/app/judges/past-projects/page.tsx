import styles from '../../roles.module.css';

const pastProjects = [
    {
        project: 'SolarSight Remote Monitoring',
        startup: 'HelioWorks',
        programme: 'CIP Spark 2024',
        completionDate: '2025-02-18',
        outcome: 'Completed and deployed in 6 pilot sites',
    },
    {
        project: 'RetailPulse Forecast Engine',
        startup: 'QuantLeaf',
        programme: 'CIP Sprint 2024',
        completionDate: '2025-05-30',
        outcome: 'Completed with 19% forecast error improvement',
    },
    {
        project: 'RehabTrack Clinical Assistant',
        startup: 'NeuroSpring',
        programme: 'CIP Spark 2023',
        completionDate: '2024-11-22',
        outcome: 'Completed and moved into commercialization stage',
    },
];

export default function PastProjectsPage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Past Projects</p>
                <h1 className={styles.pageTitle}>Completed projects repository</h1>
                <p className={styles.pageSubtitle}>
                    Archive of successfully commenced and completed projects for future referencing.
                </p>
            </section>

            <section className={styles.panel}>
                <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Startup</th>
                                <th>Programme</th>
                                <th>Completion Date</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pastProjects.map((item) => (
                                <tr key={item.project}>
                                    <td>{item.project}</td>
                                    <td>{item.startup}</td>
                                    <td>{item.programme}</td>
                                    <td>{item.completionDate}</td>
                                    <td>{item.outcome}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
