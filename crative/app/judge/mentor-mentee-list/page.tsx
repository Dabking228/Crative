import styles from '../../roles.module.css';

const menteeProgress = [
    { startup: 'AeroPulse', programme: 'CIP Spark', mentor: 'Liyana Rahman', progress: 72 },
    { startup: 'CuraLoop', programme: 'CIP Sprint', mentor: 'Azim Kadir', progress: 58 },
    { startup: 'MeshFuel', programme: 'CIP Spark', mentor: 'Priya Tan', progress: 81 },
];

const availableMentors = [
    { name: 'Faris Ahmad', expertise: 'Go-To-Market', slots: 2 },
    { name: 'Joanna Lee', expertise: 'Regulatory Strategy', slots: 1 },
    { name: 'Samuel Ong', expertise: 'Technical Architecture', slots: 3 },
];

export default function MentorMenteeListPage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Mentor-Mentee List</p>
                <h1 className={styles.pageTitle}>Track matched cohorts and mentor capacity</h1>
                <p className={styles.pageSubtitle}>
                    Overview of projects that passed first screening, current progress, and mentor availability.
                </p>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Assigned Programme Cohorts</h2>
                <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Startup</th>
                                <th>Programme</th>
                                <th>Assigned Mentor</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menteeProgress.map((item) => (
                                <tr key={item.startup}>
                                    <td>{item.startup}</td>
                                    <td>{item.programme}</td>
                                    <td>{item.mentor}</td>
                                    <td>
                                        <div className={styles.progressTrack}>
                                            <div className={styles.progressFill} style={{ width: `${item.progress}%` }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Available Mentors</h2>
                <div className={styles.tableWrap}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Mentor</th>
                                <th>Expertise</th>
                                <th>Open Slots</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableMentors.map((mentor) => (
                                <tr key={mentor.name}>
                                    <td>{mentor.name}</td>
                                    <td>{mentor.expertise}</td>
                                    <td><span className={styles.statusChip}>{mentor.slots} available</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
