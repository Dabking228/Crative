import styles from '../../roles.module.css';

const projects = [
    {
        name: 'AgriSense AI',
        programme: 'CIP Spark',
        focus: 'Precision agriculture analytics for small farms',
        phase: 'Pilot deployment',
    },
    {
        name: 'MediQueue',
        programme: 'CIP Sprint',
        focus: 'Patient queue optimization for primary clinics',
        phase: 'Product refinement',
    },
    {
        name: 'FinFlow Lite',
        programme: 'Prototype Grant',
        focus: 'Cashflow dashboard for early SMEs',
        phase: 'User validation',
    },
];

export default function StartupProjectsPage() {
    return (
        <>
            <section className={styles.heroPanel}>
                <p className={styles.kicker}>Projects</p>
                <h1 className={styles.pageTitle}>Your startup project workspace</h1>
                <p className={styles.pageSubtitle}>
                    Keep project context, programme linkage, and delivery phase in one place.
                </p>
            </section>

            <section className={styles.panel}>
                <div className={styles.gridTwo}>
                    {projects.map((project) => (
                        <article className={styles.statCard} key={project.name}>
                            <h2 className={styles.sectionTitle}>{project.name}</h2>
                            <p className={styles.newsletterMeta}>{project.programme}</p>
                            <p className={styles.sectionText}>{project.focus}</p>
                            <p className={styles.newsletterMeta}>Phase: {project.phase}</p>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
}
