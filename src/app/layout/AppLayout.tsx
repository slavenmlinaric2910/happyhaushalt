import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Plus, Users } from 'lucide-react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import { IconButton } from '../../core/ui/IconButton';
import { useCreateTaskSheet } from '../providers/CreateTaskSheetProvider';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const location = useLocation();
  const { openSheet } = useCreateTaskSheet();

  const navItems = [
    { path: '/tasks', icon: Calendar, label: 'Tasks' },
    { path: '/household', icon: Users, label: 'Household' },
  ];

  return (
    <div className={styles.app}>
      <OfflineBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {/* Tasks - Left */}
        <Link
          to="/tasks"
          className={`${styles.navItem} ${
            location.pathname === '/tasks' || location.pathname.startsWith('/tasks/') ? styles.active : ''
          }`}
        >
          <Calendar size={20} />
          <span>Tasks</span>
        </Link>

        {/* FAB - Center */}
        <div className={styles.fabWrapper}>
          <IconButton
            icon={<Plus size={24} />}
            variant="fab"
            size="lg"
            type="button"
            aria-label="Add new"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openSheet();
            }}
            className={styles.navFab}
          />
        </div>

        {/* Household - Right */}
        <Link
          to="/household"
          className={`${styles.navItem} ${
            location.pathname === '/household' || location.pathname.startsWith('/household/') ? styles.active : ''
          }`}
        >
          <Users size={20} />
          <span>Household</span>
        </Link>
      </nav>
    </div>
  );
}

