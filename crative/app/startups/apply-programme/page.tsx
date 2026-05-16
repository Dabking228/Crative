import styles from '../../roles.module.css';

export default function ApplyProgrammePage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Apply Programme</p>
                <h1 className={styles.pageTitle}>Submit a new programme application</h1>
                <p className={styles.pageSubtitle}>
                    Base template form for new startup submissions. Hook this form to your backend when ready.
                </p>
            </section>

            <section className={styles.panel}>
                <div className={styles.formGrid}>
                    <div>
                        <p className={styles.fieldLabel}>Startup Name</p>
                        <input className={styles.fieldInput} type="text" placeholder="Your startup legal name" />
                    </div>
                    <div>
                        <p className={styles.fieldLabel}>Programme</p>
                        <select className={styles.fieldSelect} defaultValue="">
                            <option value="" disabled>Select a programme</option>
                            <option value="cip-spark">CIP Spark</option>
                            <option value="cip-sprint">CIP Sprint</option>
                        </select>
                    </div>
                    <div>
                        <p className={styles.fieldLabel}>Primary Contact Email</p>
                        <input className={styles.fieldInput} type="email" placeholder="founder@startup.com" />
                    </div>
                    <div>
                        <p className={styles.fieldLabel}>Industry</p>
                        <input className={styles.fieldInput} type="text" placeholder="HealthTech, FinTech, etc" />
                    </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                    <p className={styles.fieldLabel}>Problem and Solution</p>
                    <textarea
                        className={styles.fieldTextArea}
                        placeholder="Describe problem statement, target users, and your proposed solution."
                    />
                </div>

                <div className={styles.formActions}>
                    <button type="button" className={styles.primaryButton}>Save Draft</button>
                    <button type="button" className={styles.secondaryButton}>Submit Application</button>
                </div>
            </section>
        </>
    );
}
