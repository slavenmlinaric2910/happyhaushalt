import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Fragment } from 'react';
import { ListTodo, Users } from 'lucide-react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import { BottomSheet } from '../../core/ui/BottomSheet';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
      scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname]);


  const navItems = [
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/household', icon: Users, label: 'Household' },
  ];

  const handleCreateClick = () => {
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };

  const handleCreateTask = () => {
    setIsSheetOpen(false);
    navigate('/tasks/create');
  };

  const handleCreateChore = () => {
    setIsSheetOpen(false);
    navigate('/chores/create');
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
                  onClick={handleCreateClick}
                  className={styles.navItemCreate}
                  aria-label="Create task"
                >
                  <span className={styles.plusIcon}>+</span>
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
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        onCreateTask={handleCreateTask}
        onCreateChore={handleCreateChore}
      />
    </div>
  );
}

