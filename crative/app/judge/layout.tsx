import RoleTopNav from '../components/RoleTopNav';
import styles from '../roles.module.css';

const judgesNavItems = [
    { label: 'Home', href: '/judge' },
    { label: 'Past Projects', href: '/judge/past-projects' },
    { label: 'Mentor-Mentee List', href: '/judge/mentor-mentee-list' },
    { label: 'Pending Projects', href: '/judge/pending-projects' },
];

export default function JudgesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={styles.rolePage}>
            <div className={styles.roleBackgroundGlow} aria-hidden="true" />
            <RoleTopNav
                siteName="Crative"
                navItems={judgesNavItems}
                profileInitials="CJ"
                profileLabel="Judge profile"
            />
            <main className={styles.roleContent}>{children}</main>
        </div>
    );
}
