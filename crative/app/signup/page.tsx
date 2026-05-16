import SignupForm from '../components/SignupForm';
import styles from './signup.module.css';

export default function SignupPage() {
    return (
        <div className={styles.signupPage}>
            <div className={styles.backgroundGlow} aria-hidden="true" />
            <main className={styles.signupCard}>
                <p className={styles.kicker}>Welcome to Crative</p>
                <h1 className={styles.title}>Sign up or log in</h1>
                <p className={styles.subtitle}>
                    Use the same form for registration and login. Select role first for role-based auth.
                </p>

                <SignupForm />
            </main>
        </div>
    );
}
