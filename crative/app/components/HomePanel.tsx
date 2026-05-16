import styles from '../home.module.css';

export default function HomePanel() {
    return (
        <main className={styles.portalShell}>
            <section className={styles.panel} id="overview">
                <h2 className={styles.sectionTitle}>
                    {/* TODO: Replace with your panel heading */}
                    Panel Heading Placeholder
                </h2>
                <p className={styles.descriptionLead}>
                    {/* TODO: Replace with your primary description */}
                    Lead description placeholder — a short, punchy sentence that summarises what this
                    section is about and draws the reader in.
                </p>
                <p className={styles.descriptionBody}>
                    {/* TODO: Replace with your supporting body copy */}
                    Supporting body text placeholder. Use this space to elaborate on the lead, provide
                    context, list key features, or explain the value proposition in more detail. Keep it
                    concise and scannable.
                </p>
                <div className={styles.buttonRow}>
                    {/* TODO: Add your CTA buttons */}
                    <button className={`${styles.btn} ${styles.btnPrimary}`} type="button">
                        Primary Action
                    </button>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} type="button">
                        Secondary Action
                    </button>
                </div>
            </section>
        </main>
    );
}
