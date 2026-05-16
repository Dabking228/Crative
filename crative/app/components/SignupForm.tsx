"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { firebaseAuth, firebaseConfigError, getTenantIdForRole, UserRole } from '../lib/firebase';
import styles from '../signup/signup.module.css';

type AuthMode = 'signup' | 'login';

export default function SignupForm() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>('signup');
    const [role, setRole] = useState<UserRole>('startups');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const getRoleHomeRoute = (selectedRole: UserRole) =>
        selectedRole === 'startups' ? '/startup' : '/judge';

    const getRoleAwareAuth = () => {
        if (!firebaseAuth) {
            return {
                auth: null,
                errorMessage:
                    firebaseConfigError ||
                    'Firebase Auth is not configured. Add your NEXT_PUBLIC_FIREBASE_* keys in .env.local.',
            };
        }

        const tenantId = getTenantIdForRole(role);

        if (!tenantId) {
            return {
                auth: null,
                errorMessage:
                    'Missing tenant ID for selected role. Add NEXT_PUBLIC_FIREBASE_TENANT_ID_STARTUPS and NEXT_PUBLIC_FIREBASE_TENANT_ID_JUDGES in .env.local.',
            };
        }

        firebaseAuth.tenantId = tenantId;

        return {
            auth: firebaseAuth,
            errorMessage: null,
        };
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const { auth, errorMessage } = getRoleAwareAuth();

        if (!auth) {
            setError(errorMessage || 'Firebase Auth is not configured.');
            return;
        }

        try {
            setLoading(true);

            if (mode === 'signup') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                if (name.trim()) {
                    await updateProfile(userCredential.user, {
                        displayName: name.trim(),
                    });
                }

                setSuccess(`Account created successfully as ${role}. Redirecting...`);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                setSuccess(`Logged in successfully as ${role}. Redirecting...`);
            }

            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');

            router.push(getRoleHomeRoute(role));
        } catch (submitError) {
            const errorMessage = submitError instanceof Error
                ? submitError.message
                : mode === 'signup'
                    ? 'Failed to create account.'
                    : 'Failed to log in.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.modeSwitch}>
                <button
                    type="button"
                    className={`${styles.modeButton} ${mode === 'signup' ? styles.modeButtonActive : ''}`}
                    onClick={() => {
                        setMode('signup');
                        setError('');
                        setSuccess('');
                    }}
                >
                    Sign Up
                </button>
                <button
                    type="button"
                    className={`${styles.modeButton} ${mode === 'login' ? styles.modeButtonActive : ''}`}
                    onClick={() => {
                        setMode('login');
                        setError('');
                        setSuccess('');
                    }}
                >
                    Login
                </button>
            </div>

            <label className={styles.label} htmlFor="role">Role</label>
            <select
                id="role"
                className={styles.input}
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
            >
                <option value="startups">Startups</option>
                <option value="judges">Cradle Judges</option>
            </select>

            {mode === 'signup' ? (
                <>
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
                </>
            ) : null}

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

            {mode === 'signup' ? (
                <>
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
                </>
            ) : null}

            {error ? <p className={styles.error}>{error}</p> : null}
            {success ? <p className={styles.success}>{success}</p> : null}

            <button className={styles.submitButton} type="submit" disabled={loading}>
                {loading
                    ? mode === 'signup'
                        ? 'Creating account...'
                        : 'Logging in...'
                    : mode === 'signup'
                        ? 'Sign Up'
                        : 'Login'}
            </button>

            <p className={styles.backLinkWrap}>
                <Link href="/" className={styles.backLink}>Back to home</Link>
            </p>
        </form>
    );
}
