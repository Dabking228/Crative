import styles from '../home.module.css';

export default function HomePanel() {
    return (
        <main className={styles.portalShell}>
            <section className={styles.panel} id="about-us">
                <h2 className={styles.sectionTitle}>
                    Panel Heading Placeholder
                </h2>
                <p className={styles.descriptionLead}>
                    Lead description placeholder - a short, punchy sentence that summarises what this
                    section is about and draws the reader in.
                </p>
                <p className={styles.descriptionBody}>
                    Supporting body text placeholder. Use this space to elaborate on the lead, provide
                    context, list key features, or explain the value proposition in more detail. Keep it
                    concise and scannable.
                </p>
                <div className={styles.buttonRow}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} type="button">
                        Primary Action
                    </button>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} type="button">
                        Secondary Action
                    </button>
                </div>
            </section>

            <section className={styles.panel} id="contact-us">
                <h2 className={styles.sectionTitle}>Contact Us</h2>
                <p className={styles.descriptionBody}>
                    Update this section with your preferred communication channels, support hours, and
                    response time expectations.
                </p>
                <p className={styles.descriptionBody}>
                    Email: hello@yourdomain.com
                </p>
            </section>
        </main>
    );
}
