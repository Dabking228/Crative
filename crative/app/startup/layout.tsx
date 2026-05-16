import RoleTopNav from '../components/RoleTopNav';
import styles from '../roles.module.css';

const startupNavItems = [
    { label: 'Home', href: '/startup' },
    { label: 'Projects', href: '/startup/projects' },
    { label: 'Application Status', href: '/startup/application-status' },
    { label: 'Apply Programme', href: '/startup/apply-programme' },
];

export default function StartupsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={styles.rolePage}>
            <div className={styles.roleBackgroundGlow} aria-hidden="true" />
            <RoleTopNav
                siteName="Crative"
                navItems={startupNavItems}
                profileInitials="SU"
                profileLabel="Startup profile"
            />
            <main className={styles.roleContent}>{children}</main>
        </div>
    );
}
