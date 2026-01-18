import { Outlet, Link, useLocation } from 'react-router-dom';
import { ListTodo, Users } from 'lucide-react';
import { useState } from 'react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import { CreateModal } from '../../core/ui/CreateModal';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navItems = [
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/household', icon: Users, label: 'Household' },
  ];

  const handleCreateTask = () => {
    console.log('Create new task');
    setIsCreateModalOpen(false);
    // TODO: Navigate to create task form
  };

  const handleCreateChore = () => {
    console.log('Create new chore');
    setIsCreateModalOpen(false);
    // TODO: Navigate to create chore form
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
              <>
                <button
                  key="create"
                  onClick={() => setIsCreateModalOpen(true)}
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
              </>
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
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
        onCreateChore={handleCreateChore}
      />
    </div>
  );
}

