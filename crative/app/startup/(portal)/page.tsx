import Image from 'next/image';
import styles from '../../roles.module.css';

const showcase = [
    { title: 'Demo Day Highlights', image: '/rm100.jpg' },
    { title: 'Prototype Lab Session', image: '/rm100.jpg' },
    { title: 'Community Pitch Event', image: '/rm100.jpg' },
];

const newsletters = [
    {
        title: 'Crative Monthly Digest: March Highlights',
        meta: 'Featuring 8 startup milestones, investor engagement updates, and community outcomes.',
    },
    {
        title: 'Founder Story: Scaling from Idea to Traction',
        meta: 'A quick retrospective from a previous cohort startup that shipped in 12 weeks.',
    },
    {
        title: 'Mentor Notes: Product Validation Toolkit',
        meta: 'Practical lessons from judges and mentors on improving go-to-market readiness.',
    },
];

export default function StartupsHomePage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Startup Home</p>
                <h1 className={styles.pageTitle}>Welcome back, founder team</h1>
                <p className={styles.pageSubtitle}>
                    This is your default landing page after login. Browse Crative project highlights and
                    newsletters while tracking your current application journey.
                </p>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Project Gallery</h2>
                <p className={styles.sectionText}>
                    Snapshot moments from previous Crative projects.
                </p>
                <div className={styles.imageColumns}>
                    {showcase.map((item) => (
                        <article className={styles.imageCard} key={item.title}>
                            <Image
                                src={item.image}
                                alt={item.title}
                                width={640}
                                height={360}
                                className={styles.imageFrame}
                            />
                            <p className={styles.imageCaption}>{item.title}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Newsletters and Updates</h2>
                <ul className={styles.newsletterList}>
                    {newsletters.map((entry) => (
                        <li className={styles.newsletterItem} key={entry.title}>
                            <h3 className={styles.newsletterTitle}>{entry.title}</h3>
                            <p className={styles.newsletterMeta}>{entry.meta}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}
