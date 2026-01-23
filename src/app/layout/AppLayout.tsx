import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Fragment } from 'react';
import { ListTodo, Plus, Users } from 'lucide-react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo';
import { supabase } from '../../lib/supabase/client';
import { useHouseholdRepo } from '../providers/RepoProvider';
import { BottomSheet } from '../../core/ui/BottomSheet';
import styles from './AppLayout.module.css';

const taskRepo = new SupabaseTaskRepo();

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const householdRepo = useHouseholdRepo();

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

  const handleCreateChore = async () => {
    setIsSheetOpen(false);
    
    // Get current user from session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user found');
      return;
    }

    // Get current household
    const currentHousehold = await householdRepo.getCurrentHousehold();
    if (!currentHousehold) {
      console.error('No household found for current user');
      return;
    }

    // Test data for creating a task
    const testTaskInput = {
      householdId: currentHousehold.id, // Current household ID
      templateId: null, // No template for manual task
      title: 'Test Task - Küche aufräumen',
      dueDate: new Date('2026-02-01'), // 01.02.2026
      assignedUserId: session.user.id, // Current authenticated user
      status: 'open' as const,
    };

    try {
      const createdTask = await taskRepo.createTask(testTaskInput);
      console.log('Task created successfully:', createdTask);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
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

