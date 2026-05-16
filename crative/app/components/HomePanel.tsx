import Link from 'next/link';
import styles from '../home.module.css';

export default function HomePanel() {
    return (
        <main className={styles.portalShell}>
            <section className={styles.panel} id="about-us">
                <h2 className={styles.sectionTitle}>
                    Empowering Malaysian Startups Through AI-Driven Evaluation
                </h2>
                <p className={styles.descriptionLead}>
                    The startup funding process is slow, opaque, and inconsistently applied, leaving
                    high-potential founders waiting months for a verdict they deserve in days.
                </p>
                <p className={styles.descriptionBody}>
                    Crative is Cradle Fund&apos;s AI-powered ecosystem portal that transforms how startups
                    are discovered, evaluated, and supported. Our multi-model AI pipeline, powered by
                    Gemini, Claude, and Grok will screens eligibility in real time, conducts structured
                    investment interviews, and delivers consensus-based recommendations to Cradle&apos;s
                    judges. Approved startups are matched with domain-expert mentors and guided through
                    a structured development roadmap, with every milestone verified and monitored
                    end-to-end.
                </p>
                <div className={styles.flowGrid} style={{ marginBottom: '20px' }}>
                    {[
                        { step: '01', title: 'AI Eligibility Screen', desc: 'Upload SSM & pitch deck. Gemini Gatekeeper streams a real-time program eligibility verdict in seconds.' },
                        { step: '02', title: 'Investment Interview', desc: 'Claude generates tailored questions to interview founders, responses is recorded for the multi-model consensus engine.' },
                        { step: '03', title: 'Judge Panel Review', desc: 'Three AI models score seven dimensions. Cradle judges receive a summary of project recommendation with full reasoning.' },
                        { step: '04', title: 'Mentor & Roadmap', desc: 'Approved startups are matched with expert mentors and co-build a milestone roadmap tracked by Cradle.' },
                    ].map((item) => (
                        <div key={item.step} className={styles.flowStep}>
                            <h3 style={{ color: '#25d9ff' }}>{item.step} — {item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>
                <div className={styles.buttonRow}>
                    <Link href="/signup" className={`${styles.btn} ${styles.btnPrimary}`}>
                        Join Us Now
                    </Link>
                </div>
            </section>

            <section className={styles.panel} id="contact-us">
                <h2 className={styles.sectionTitle}>Contact Us</h2>
                <p className={styles.descriptionLead}>Cradle Fund Sdn Bhd</p>
                <p className={styles.descriptionBody}>
                    Level 11, Axiata Tower, No. 9, Jalan Stesen Sentral 5,<br />
                    Kuala Lumpur Sentral, 50470 Kuala Lumpur, Malaysia
                </p>
                <p className={styles.descriptionBody}>
                    <strong style={{ color: 'rgba(255,255,255,0.8)' }}>General Enquiries:</strong>{' '}
                    <a href="mailto:enquiry@cradle.com.my" style={{ color: '#25d9ff', textDecoration: 'none' }}>
                        enquiry@cradle.com.my
                    </a>
                    <br />
                    <strong style={{ color: 'rgba(255,255,255,0.8)' }}>CIP Programme:</strong>{' '}
                    <a href="mailto:cip@cradle.com.my" style={{ color: '#25d9ff', textDecoration: 'none' }}>
                        cip@cradle.com.my
                    </a>
                    <br />
                    <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Phone:</strong>{' '}
                    +603 2057 9000
                    <br />
                    <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Website:</strong>{' '}
                    <a href="https://www.cradle.com.my" target="_blank" rel="noopener noreferrer" style={{ color: '#25d9ff', textDecoration: 'none' }}>
                        www.cradle.com.my
                    </a>
                </p>
                <p className={styles.descriptionBody} style={{ marginBottom: 0 }}>
                    Office hours: Monday – Friday, 9:00 AM – 5:30 PM (MYT)
                </p>
            </section>
        </main>
    );
}
