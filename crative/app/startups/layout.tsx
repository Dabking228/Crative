import RoleTopNav from '../components/RoleTopNav';
import styles from '../roles.module.css';

const startupNavItems = [
    { label: 'Home', href: '/startups' },
    { label: 'Projects', href: '/startups/projects' },
    { label: 'Application Status', href: '/startups/application-status' },
    { label: 'Apply Programme', href: '/startups/apply-programme' },
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
