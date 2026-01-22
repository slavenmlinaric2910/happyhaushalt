import { Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ListTodo, Plus, Users } from 'lucide-react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/household', icon: Users, label: 'Household' },
  ];

  const handleCreateTask = () => {
    // TODO: Implement create task modal/dialog
    console.log('Create new task');
  };

  return (
    <div className={styles.app}>
      <OfflineBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          
          // Insert create button between Tasks and Household
          if (index === 1) {
            return (
              <Fragment key={`nav-${index}`}>
                <button
                  key="create"
                  onClick={handleCreateTask}
                  className={styles.navItemCreate}
                  aria-label="Create task"
                >
                  <Plus size={28} />
                </button>
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </Fragment>
            );
          }

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

