import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export type UserRole = 'startups' | 'judges';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

const firebaseApp =
    missingFirebaseKeys.length === 0
        ? getApps().length
            ? getApp()
            : initializeApp(firebaseConfig)
        : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export const firebaseConfigError =
    missingFirebaseKeys.length > 0
        ? `Missing Firebase env vars: ${missingFirebaseKeys.join(', ')}`
        : null;

const tenantByRole: Record<UserRole, string | undefined> = {
    startups: process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID_STARTUPS,
    judges: process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID_JUDGES,
};

export const getTenantIdForRole = (role: UserRole) => tenantByRole[role] ?? null;
