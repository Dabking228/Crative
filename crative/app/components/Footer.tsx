import styles from '../home.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                {/* TODO: Replace with your logo / brand name */}
                <span className={styles.footerLogo}>Brand Name</span>

                <ul className={styles.footerLinks}>
                    {/* TODO: Add / remove nav links */}
                    <li><a href="#" className={styles.footerLink}>Features</a></li>
                    <li><a href="#" className={styles.footerLink}>Pricing</a></li>
                    <li><a href="#" className={styles.footerLink}>About</a></li>
                    <li><a href="#" className={styles.footerLink}>Blog</a></li>
                    <li><a href="#" className={styles.footerLink}>Privacy Policy</a></li>
                    <li><a href="#" className={styles.footerLink}>Terms of Service</a></li>
                </ul>

                {/* TODO: Update year and legal entity */}
                <span className={styles.footerCopy}>
                    &copy; {new Date().getFullYear()} Brand Name. All rights reserved.
                </span>
            </div>
        </footer>
    );
}
