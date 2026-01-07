import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, ListTodo, Users } from 'lucide-react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/today', icon: Calendar, label: 'Today' },
    { path: '/chores', icon: ListTodo, label: 'Chores' },
    { path: '/household', icon: Users, label: 'Household' },
  ];

  return (
    <div className={styles.app}>
      <OfflineBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

