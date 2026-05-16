import Link from 'next/link';
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
                    <a href="#about-us">About Us</a>
                    <a href="#contact-us">Contact Us</a>
                    <Link href="/signup" className={styles.navCta}>Login / Signup</Link>
                </div>
            </nav>

            <ParticleCanvas />
            <HomePanel />
            <Footer />
        </div>
    );
}
