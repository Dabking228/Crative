import RoleTopNav from '../../components/RoleTopNav';
import styles from '../../roles.module.css';

const judgesNavItems = [
    { label: 'Home', href: '/judge' },
    { label: 'Judge Queue', href: '/judge/queue' },
    { label: 'Ecosystem Graph', href: '/judge/graph' },
    { label: 'Past Projects', href: '/judge/past-projects' },
    { label: 'Mentor-Mentee List', href: '/judge/mentor-mentee-list' },
    { label: 'Pending Projects', href: '/judge/pending-projects' },
];

export default function JudgesPortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={styles.rolePage}>
            <div className={styles.roleBackgroundGlow} aria-hidden="true" />
            <RoleTopNav
                siteName="Crative"
                homeHref="/judge"
                navItems={judgesNavItems}
                profileInitials="CJ"
                profileLabel="Judge profile"
            />
            <main className={styles.roleContent}>{children}</main>
        </div>
    );
}
