import { Outlet, Link, useLocation } from 'react-router-dom';
import { ListTodo, Users } from 'lucide-react';
import { useState } from 'react';
import { OfflineBanner } from '../../core/ui/OfflineBanner';
import { CreateModal } from '../../core/ui/CreateModal';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo';
import { supabase } from '../../lib/supabase/client';
import { useHouseholdRepo } from '../providers/RepoProvider';
import styles from './AppLayout.module.css';

const taskRepo = new SupabaseTaskRepo();

export function AppLayout() {
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const householdRepo = useHouseholdRepo();

  const navItems = [
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/household', icon: Users, label: 'Household' },
  ];

  const handleCreateTask = () => {
    console.log('Create new task');
    setIsCreateModalOpen(false);
    // TODO: Navigate to create task form
  };

  const handleCreateChore = async () => {
    setIsCreateModalOpen(false);
    
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

