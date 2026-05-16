import SignupForm from '../components/SignupForm';
import styles from './signup.module.css';

export default function SignupPage() {
    return (
        <div className={styles.signupPage}>
            <div className={styles.backgroundGlow} aria-hidden="true" />
            <main className={styles.signupCard}>
                <p className={styles.kicker}>Welcome to Crative</p>
                <h1 className={styles.title}>Create your account</h1>
                <p className={styles.subtitle}>
                    Register with your email and password.
                </p>

                <SignupForm />
            </main>
        </div>
    );
}
