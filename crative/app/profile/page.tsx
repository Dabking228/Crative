'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, updateProfile, updateEmail, User } from 'firebase/auth';
import { firebaseAuth, getRoleFromTenantId } from '../lib/firebase';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (!firebaseAuth) { router.replace('/'); return; }
        const unsub = onAuthStateChanged(firebaseAuth, (u) => {
            if (!u) { router.replace('/'); return; }
            setUser(u);
            setDisplayName(u.displayName ?? '');
            setEmail(u.email ?? '');
            setLoading(false);
        });
        return unsub;
    }, [router]);

    const roleLabel = (() => {
        if (!user) return '—';
        const role = getRoleFromTenantId(firebaseAuth?.tenantId ?? null);
        if (role === 'judges') return 'Cradle Judge';
        if (role === 'mentors') return 'Mentor';
        return 'Startup Founder';
    })();

    const homeHref = (() => {
        const role = getRoleFromTenantId(firebaseAuth?.tenantId ?? null);
        if (role === 'judges') return '/judge';
        if (role === 'mentors') return '/mentor';
        return '/startup';
    })();

    const handleSave = async () => {
        if (!user || !firebaseAuth) return;
        setSaving(true);
        setSaveError('');
        setSaveSuccess('');
        try {
            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName });
            }
            if (email !== user.email) {
                await updateEmail(user, email);
            }
            setSaveSuccess('Profile updated successfully.');
            setEditMode(false);
            setUser({ ...user, displayName, email } as User);
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        if (!firebaseAuth) return;
        await signOut(firebaseAuth);
        router.replace('/');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#050508', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</span>
            </div>
        );
    }

    const inputStyle = (editable: boolean): React.CSSProperties => ({
        width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '0.92rem',
        background: editable ? 'rgba(37,217,255,0.05)' : 'rgba(255,255,255,0.04)',
        border: editable ? '1px solid rgba(37,217,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
        color: editable ? '#fff' : 'rgba(255,255,255,0.7)',
        outline: 'none', boxSizing: 'border-box',
        cursor: editable ? 'text' : 'default',
    });

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#050508', color: 'white' }}>
            {/* Nav */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 10,
                padding: '16px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: 0 }}
                >
                    ← Back
                </button>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>My Profile</span>
            </nav>

            <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 20px 80px' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', fontWeight: 700, color: '#021226', marginBottom: '12px',
                    }}>
                        {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.displayName || 'No name set'}</div>
                    <div style={{
                        marginTop: '6px', padding: '3px 12px', borderRadius: '999px', fontSize: '0.75rem',
                        background: 'rgba(37,217,255,0.12)', color: '#25d9ff', border: '1px solid rgba(37,217,255,0.3)',
                    }}>
                        {roleLabel}
                    </div>
                </div>

                {/* Fields */}
                <div style={{ background: 'rgba(32,38,56,0.76)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px', marginBottom: '16px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Full Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            readOnly={!editMode}
                            style={inputStyle(editMode)}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly={!editMode}
                            style={inputStyle(editMode)}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Role</label>
                        <input type="text" value={roleLabel} readOnly style={inputStyle(false)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Account ID</label>
                        <input type="text" value={user?.uid ?? '—'} readOnly style={inputStyle(false)} />
                    </div>

                    {saveError && <p style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '12px' }}>{saveError}</p>}
                    {saveSuccess && <p style={{ color: '#2ed573', fontSize: '0.85rem', marginTop: '12px' }}>{saveSuccess}</p>}

                    {/* Edit / Save buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                        {!editMode ? (
                            <button
                                onClick={() => { setEditMode(true); setSaveSuccess(''); setSaveError(''); }}
                                style={{
                                    padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 600,
                                    cursor: 'pointer', fontSize: '0.9rem',
                                }}
                            >
                                Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '10px 24px', borderRadius: '10px', border: 'none',
                                        background: 'linear-gradient(135deg, #25d9ff, #1495ff)',
                                        color: '#021226', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem', opacity: saving ? 0.7 : 1,
                                    }}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditMode(false);
                                        setDisplayName(user?.displayName ?? '');
                                        setEmail(user?.email ?? '');
                                        setSaveError('');
                                    }}
                                    style={{
                                        padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600,
                                        cursor: 'pointer', fontSize: '0.9rem',
                                    }}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Home link */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <button
                        onClick={() => router.push(homeHref)}
                        style={{
                            background: 'none', border: 'none', color: '#25d9ff',
                            fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline',
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>

                {/* Logout */}
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '12px 40px', borderRadius: '10px',
                            border: '1px solid rgba(255,71,87,0.4)',
                            background: 'rgba(255,71,87,0.08)', color: '#ff4757',
                            fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
