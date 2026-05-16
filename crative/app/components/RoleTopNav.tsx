import Link from 'next/link';
import styles from '../roles.module.css';

type NavItem = {
    label: string;
    href: string;
};

type RoleTopNavProps = {
    siteName: string;
    navItems: NavItem[];
    profileInitials: string;
    profileLabel: string;
};

export default function RoleTopNav({
    siteName,
    navItems,
    profileInitials,
    profileLabel,
}: RoleTopNavProps) {
    return (
        <nav className={styles.roleNav}>
            <div className={styles.roleNavInner}>
                <div className={styles.roleBrand}>{siteName}</div>

                <div className={styles.roleNavRight}>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className={styles.roleNavButton}>
                            {item.label}
                        </Link>
                    ))}

                    <button className={styles.avatarButton} type="button" aria-label={profileLabel}>
                        <span className={styles.avatarInitials}>{profileInitials}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
