import styles from '../roles.module.css';

export default function JudgesHomePage() {
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
                        <p className={styles.statValue}>34</p>
                    </article>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Active Mentor Matches</p>
                        <p className={styles.statValue}>18</p>
                    </article>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Available Mentors</p>
                        <p className={styles.statValue}>9</p>
                    </article>
                    <article className={styles.statCard}>
                        <p className={styles.statLabel}>Completed Projects</p>
                        <p className={styles.statValue}>126</p>
                    </article>
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
