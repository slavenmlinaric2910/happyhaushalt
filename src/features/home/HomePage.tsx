import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useHouseholdRepo, useChoreRepo } from '../../app/providers/RepoProvider';
import { IconButton } from '../../core/ui/IconButton';
import { HouseMoodCard } from './HouseMoodCard';
import styles from './HomePage.module.css';
import { TaskListSection } from './TaskListSection';
import { Settings } from 'lucide-react';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo';
import { CompletedTasksPage } from '@/features/filter/CompletedTasksPage';
import { DeletedTasksPage } from '@/features/filter/DeletedTasksPage';

// Dev-Flag anlegen zum Testen
const IS_DEV_MOCK = false;

const taskRepo = new SupabaseTaskRepo();

type TaskLike = {
  id: string;
  choreTemplateId: string;
  dueDate: string | Date;
  completedAt?: string | Date | null;
};

type HomeView = 'home' | 'completed' | 'deleted';
type TaskScope = 'mine' | 'all';

// Hilfsfunktion außerhalb des Components
function groupTasksByDueDate<T extends TaskLike>(tasks: T[], today: Date) {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const overdueTasks: T[] = [];
  const todayTasks: T[] = [];
  const upcomingTasks: T[] = [];

  for (const task of tasks) {
    if (task.completedAt) continue;

    const due = new Date(task.dueDate);

    if (due < startOfToday) {
      overdueTasks.push(task);
    } else if (due >= startOfToday && due < startOfTomorrow) {
      todayTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  }

  return { overdueTasks, todayTasks, upcomingTasks };
}

export function HomePage() {
  const householdRepo = useHouseholdRepo();
  const choreRepo = useChoreRepo();
  const queryClient = useQueryClient();
  const [view, setView] = useState<HomeView>('home');
  const [scope, setScope] = useState<TaskScope>('mine');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const isCompletedSelected = view === 'completed';
  const isDeletedSelected = view === 'deleted';
  const isMineSelected = view === 'home' && scope === 'mine';
  const isAllSelected = view === 'home' && scope === 'all';

  useEffect(() => {
    if (!isFilterOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const clickedButton = filterButtonRef.current?.contains(target);
      const clickedMenu = filterMenuRef.current?.contains(target);

      if (!clickedButton && !clickedMenu) setIsFilterOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFilterOpen]);

  const applyFilter = (key: 'completed' | 'deleted' | 'mine' | 'all') => {
    if (key === 'completed') setView('completed');
    if (key === 'deleted') setView('deleted');
    if (key === 'mine') {
      setView('home');
      setScope('mine');
    }
    if (key === 'all') {
      setView('home');
      setScope('all');
    }
    setIsFilterOpen(false);
  };

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => householdRepo.getCurrentHousehold(),
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1000000);
    return d;
  }, [today]);

  const { data: tasksFromQuery = [] } = useQuery({
    queryKey: ['tasks', household?.id, today.toISOString()],
    queryFn: async () => {
      if (!household) return [];
      await taskRepo.regenerateTasksIfNeeded();
      return taskRepo.listTasks(household.id, { start: today, end: tomorrow });
    },
    enabled: !!household,
  });

  const { overdueTasks, todayTasks, upcomingTasks } = useMemo(
    () => groupTasksByDueDate(tasksFromQuery as TaskLike[], today),
    [tasksFromQuery, today],
  );

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return choreRepo.listChores(household.id);
    },
    enabled: !!household,
  });

  const choreById = useMemo(() => {
    const map = new Map<string, { name: string; area: string }>();
    for (const c of chores) {
      map.set(c.id, { name: c.name, area: c.area || 'Other' });
    }

    if (IS_DEV_MOCK) {
      map.set('dishes', { name: 'Dishes', area: 'Kitchen' });
      map.set('vacuum', { name: 'Vacuum', area: 'Living Room' });
      map.set('plants', { name: 'Water plants', area: 'Balcony' });
    }

    return map;
  }, [chores]);

  const handleCompleteTask = async (taskId: string) => {
    await taskRepo.completeTask(taskId);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleDeleteTask = async (taskId: string) => {
    await taskRepo.deleteTask(taskId);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['deletedTasks'] });
  };

  const handleEditTask = (taskId: string) => {
    console.log('edit task', taskId);
  };

  if (view === 'completed') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Tasks</h1>
          <button type="button" className={styles.tab} onClick={() => setView('home')}>
            Back
          </button>
        </header>

        <CompletedTasksPage />
      </div>
    );
  } else if (view === 'deleted') {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Tasks</h1>
          <button type="button" className={styles.tab} onClick={() => setView('home')}>
            Back
          </button>
        </header>
        <DeletedTasksPage />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <IconButton
          icon={<Settings size={20} />}
          variant="ghost"
          size="md"
          aria-label="Settings"
        />
      </header>

      <HouseMoodCard status="good" message="All good — nothing overdue."/>

      <div className={styles.tabs}>
        <div className={styles.filterWrap}>
          <button
            ref={filterButtonRef}
            type="button"
            className={styles.filterButton}
            onClick={() => setIsFilterOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isFilterOpen}
            aria-controls="task-filter-menu"
          >
            Filter <span className={styles.filterChevron} aria-hidden="true">▾</span>
          </button>

          {isFilterOpen && (
            <div
              id="task-filter-menu"
              ref={filterMenuRef}
              className={styles.filterMenu}
              role="menu"
              aria-label="Filter"
            >
              <button
                type="button"
                className={styles.filterOption}
                onClick={() => applyFilter('completed')}
                role="menuitemradio"
                aria-checked={isCompletedSelected}
              >
                Completed
              </button>
              <button
                type="button"
                className={styles.filterOption}
                onClick={() => applyFilter('deleted')}
                role="menuitemradio"
                aria-checked={isDeletedSelected}
              >
                Deleted
              </button>
              <button
                type="button"
                className={styles.filterOption}
                onClick={() => applyFilter('mine')}
                role="menuitemradio"
                aria-checked={isMineSelected}
              >
                Mine
              </button>
              <button
                type="button"
                className={styles.filterOption}
                onClick={() => applyFilter('all')}
                role="menuitemradio"
                aria-checked={isAllSelected}
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>

      <section className={styles.tasksSection}>
        <TaskListSection
          title="Overdue"
          emptyMessage="No overdue tasks"
          tasks={overdueTasks}
          choreById={choreById}
          onToggleComplete={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
        <TaskListSection
          title="Due today"
          emptyMessage="No tasks for today"
          tasks={todayTasks}
          choreById={choreById}
          onToggleComplete={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
        <TaskListSection
          title="Upcoming"
          emptyMessage="No upcoming tasks"
          tasks={upcomingTasks}
          choreById={choreById}
          onToggleComplete={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      </section>
    </div>
  );
}
