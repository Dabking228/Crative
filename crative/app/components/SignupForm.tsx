"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseAuth, firebaseConfigError } from '../lib/firebase';
import styles from '../signup/signup.module.css';

export default function SignupForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!firebaseAuth) {
            setError(
                firebaseConfigError ||
                'Firebase Auth is not configured. Add your NEXT_PUBLIC_FIREBASE_* keys in .env.local.'
            );
            return;
        }

        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

            if (name.trim()) {
                await updateProfile(userCredential.user, {
                    displayName: name.trim(),
                });
            }

            setSuccess('Account created successfully.');
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (submitError) {
            const errorMessage = submitError instanceof Error ? submitError.message : 'Failed to create account.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="name">Full Name</label>
            <input
                id="name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Albert Einstein"
                autoComplete="name"
            />

            <label className={styles.label} htmlFor="email">Email</label>
            <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
            />

            <label className={styles.label} htmlFor="password">Password</label>
            <input
                id="password"
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
            />

            <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <input
                id="confirmPassword"
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                minLength={6}
                required
            />

            {error ? <p className={styles.error}>{error}</p> : null}
            {success ? <p className={styles.success}>{success}</p> : null}

            <button className={styles.submitButton} type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p className={styles.backLinkWrap}>
                <Link href="/" className={styles.backLink}>Back to home</Link>
            </p>
        </form>
    );
}
