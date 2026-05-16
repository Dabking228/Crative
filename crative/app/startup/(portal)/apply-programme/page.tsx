'use client';

import { useRouter } from 'next/navigation';
import styles from '../../../roles.module.css';

export default function ApplyProgrammePage() {
    const router = useRouter();

    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Apply Programme</p>
                <h1 className={styles.pageTitle}>Submit a new programme application</h1>
                <p className={styles.pageSubtitle}>
                    Applications are processed through the AI-powered Cradle portal. The system performs
                    document verification, eligibility screening, and generates an interview before your
                    submission reaches the judge panel.
                </p>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>What happens when you apply</h2>
                <ul className={styles.newsletterList} style={{ marginTop: '12px' }}>
                    <li className={styles.newsletterItem}>
                        <h3 className={styles.newsletterTitle}>1. Document Upload</h3>
                        <p className={styles.newsletterMeta}>
                            Upload your SSM certificate and pitch deck. Mistral OCR extracts and validates your company details automatically.
                        </p>
                    </li>
                    <li className={styles.newsletterItem}>
                        <h3 className={styles.newsletterTitle}>2. AI Eligibility Screening</h3>
                        <p className={styles.newsletterMeta}>
                            Gemini Gatekeeper checks CIP Spark / CIP Sprint eligibility criteria in real time — Malaysian ownership, director residency, company age, and more.
                        </p>
                    </li>
                    <li className={styles.newsletterItem}>
                        <h3 className={styles.newsletterTitle}>3. Investment Interview</h3>
                        <p className={styles.newsletterMeta}>
                            Claude Sonnet generates 4 targeted questions based on your eligibility profile and pitch deck. Answer them in the portal.
                        </p>
                    </li>
                    <li className={styles.newsletterItem}>
                        <h3 className={styles.newsletterTitle}>4. Judge Panel Review</h3>
                        <p className={styles.newsletterMeta}>
                            Three AI models (Gemini, Claude, Grok) analyse your application in parallel across 7 dimensions. A human judge reviews the consensus and delivers the final verdict.
                        </p>
                    </li>
                </ul>

                <div className={styles.formActions} style={{ marginTop: '20px' }}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => router.push('/startup/apply')}
                    >
                        Start AI Application →
                    </button>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => router.push('/startup/application-status')}
                    >
                        Track Existing Application
                    </button>
                </div>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Programme eligibility at a glance</h2>
                <div className={styles.tableWrap} style={{ marginTop: '12px' }}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Criterion</th>
                                <th>CIP Spark</th>
                                <th>CIP Sprint</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Malaysian Ownership</td>
                                <td>≥ 51%</td>
                                <td>≥ 51%</td>
                            </tr>
                            <tr>
                                <td>Company Age</td>
                                <td>≤ 5 years</td>
                                <td>≤ 10 years</td>
                            </tr>
                            <tr>
                                <td>Incorporation</td>
                                <td>Sdn Bhd (SSM)</td>
                                <td>Sdn Bhd (SSM)</td>
                            </tr>
                            <tr>
                                <td>Director Residency</td>
                                <td>At least 1 Malaysian resident</td>
                                <td>At least 1 Malaysian resident</td>
                            </tr>
                            <tr>
                                <td>MRR requirement</td>
                                <td>None</td>
                                <td>Demonstrated traction preferred</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
