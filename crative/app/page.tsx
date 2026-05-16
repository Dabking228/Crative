import ParticleCanvas from './components/ParticleCanvas';
import HomePanel from './components/HomePanel';
import Footer from './components/Footer';
import styles from './home.module.css';

export default function Home() {
    return (
        <div className={styles.pageWrapper}>
            <nav className={styles.portalNav}>
                <div className={styles.brand}>Cradle Ecosystem Portal</div>
                <div className={styles.navLinks}>
                    <a href="#overview">Overview</a>
                    <a href="#pipeline">Pipeline</a>
                    <a href="#judging">Consensus Table</a>
                    <a href="#verification">Verification</a>
                </div>
            </nav>

            <ParticleCanvas />
            <HomePanel />
            <Footer />
        </div>
    );
}
