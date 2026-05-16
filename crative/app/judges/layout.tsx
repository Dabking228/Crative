import RoleTopNav from '../components/RoleTopNav';
import styles from '../roles.module.css';

const judgesNavItems = [
    { label: 'Home', href: '/judges' },
    { label: 'Past Projects', href: '/judges/past-projects' },
    { label: 'Mentor-Mentee List', href: '/judges/mentor-mentee-list' },
    { label: 'Pending Projects', href: '/judges/pending-projects' },
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
