import RoleTopNav from '../../components/RoleTopNav';
import styles from '../../roles.module.css';

const mentorNavItems = [
    { label: 'Home', href: '/mentor' },
    { label: 'My Startups', href: '/mentor/my-startups' },
];

export default function MentorPortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={styles.rolePage}>
            <div className={styles.roleBackgroundGlow} aria-hidden="true" />
            <RoleTopNav
                siteName="Crative"
                homeHref="/mentor"
                navItems={mentorNavItems}
                profileInitials="MT"
                profileLabel="Mentor profile"
            />
            <main className={styles.roleContent}>{children}</main>
        </div>
    );
}
