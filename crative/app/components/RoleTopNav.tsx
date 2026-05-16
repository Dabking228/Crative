'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../roles.module.css';

type NavItem = {
    label: string;
    href: string;
};

type RoleTopNavProps = {
    siteName: string;
    homeHref: string;
    navItems: NavItem[];
    profileInitials: string;
    profileLabel: string;
};

export default function RoleTopNav({
    siteName,
    homeHref,
    navItems,
    profileInitials,
    profileLabel,
}: RoleTopNavProps) {
    const router = useRouter();

    return (
        <nav className={styles.roleNav}>
            <div className={styles.roleNavInner}>
                <Link href={homeHref} className={styles.roleBrand} style={{ textDecoration: 'none' }}>
                    {siteName}
                </Link>

                <div className={styles.roleNavRight}>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className={styles.roleNavButton}>
                            {item.label}
                        </Link>
                    ))}

                    <button
                        className={styles.avatarButton}
                        type="button"
                        aria-label={profileLabel}
                        onClick={() => router.push('/profile')}
                        title="View profile"
                    >
                        <span className={styles.avatarInitials}>{profileInitials}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
