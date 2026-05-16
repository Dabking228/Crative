import styles from '../home.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                <span className={styles.footerLogo}>Crative</span>

                <ul className={styles.footerLinks}>
                    <li><a href="#" className={styles.footerLink}>Features</a></li>
                    <li><a href="#" className={styles.footerLink}>Pricing</a></li>
                    <li><a href="#" className={styles.footerLink}>About</a></li>
                    <li><a href="#" className={styles.footerLink}>Blog</a></li>
                    <li><a href="#" className={styles.footerLink}>Privacy Policy</a></li>
                    <li><a href="#" className={styles.footerLink}>Terms of Service</a></li>
                </ul>

                <span className={styles.footerCopy}>
                    &copy; {new Date().getFullYear()} Crative. All rights reserved.
                </span>
            </div>
        </footer>
    );
}
