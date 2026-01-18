import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRepo } from '../../app/providers/RepoProvider';
import { IconButton } from '../../core/ui/IconButton';
import { HouseMoodCard } from './HouseMoodCard';
import styles from './HomePage.module.css';
import {TaskListSection} from './TaskListSection';
import { Settings } from 'lucide-react';

// Dev-Flag anlegen zum Testen
const IS_DEV_MOCK = true;

type TaskLike = {
  id: string;
  choreTemplateId: string;
  dueDate: string | Date;
  completedAt?: string | Date | null;
};

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
  const repo = useRepo();
  const queryClient = useQueryClient();

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => repo.getCurrentHousehold(),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: tasksFromQuery = [] } = useQuery({
    queryKey: ['tasks', household?.id, today.toISOString()],
    queryFn: async () => {
      if (!household) return [];
      await repo.regenerateTasksIfNeeded(household.id);
      return repo.listTasks(household.id, { start: today, end: tomorrow });
    },
    enabled: !!household,
  });

  // Entwicklermock: so tun, als gäbe es schon Aufgaben
  const tasks: TaskLike[] = IS_DEV_MOCK
    ? [
      {
        id: 't1',
        choreTemplateId: 'dishes',
        dueDate: today, // Due today
        completedAt: null,
      },
      {
        id: 't2',
        choreTemplateId: 'vacuum',
        dueDate: new Date(today.getTime() - 24 * 60 * 60 * 1000), // gestern -> overdue
        completedAt: null,
      },
      {
        id: 't3',
        choreTemplateId: 'plants',
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // in 3 Tagen -> upcoming
        completedAt: null,
      },
    ]
    : tasksFromQuery;


  const { overdueTasks, todayTasks, upcomingTasks } = useMemo(
    () => groupTasksByDueDate(tasks, today),
    [tasks, today],
  );

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return repo.listChores(household.id);
    },
    enabled: !!household,
  });

  const choreById = useMemo(() => {
    const map = new Map<string, { name: string; area: string }>();
    for (const c of chores) {
      map.set(c.id, { name: c.name, area: c.area });
    }

    if (IS_DEV_MOCK) {
      map.set('dishes', { name: 'Dishes', area: 'Kitchen' });
      map.set('vacuum', { name: 'Vacuum', area: 'Living Room' });
      map.set('plants', { name: 'Water plants', area: 'Balcony' });
    }

    return map;
  }, [chores]);

  const handleCompleteTask = async (taskId: string) => {
    await repo.completeTask(taskId);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

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

      <HouseMoodCard status="good" message="All good — nothing overdue." />

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.tabActive}`}>Mine</button>
        <button className={styles.tab}>All</button>
      </div>

      <section className={styles.tasksSection}>
        <TaskListSection
          title="Overdue"
          emptyMessage="No overdue tasks"
          tasks={overdueTasks}
          choreById={choreById}
          onToggleComplete={handleCompleteTask}
        />
        <TaskListSection
          title="Due today"
          emptyMessage="No tasks for today"
          tasks={todayTasks}
          choreById={choreById}
          onToggleComplete={handleCompleteTask}
        />
        <TaskListSection
          title="Upcoming"
          emptyMessage="No upcoming tasks"
          tasks={upcomingTasks}
          choreById={choreById}
          onToggleComplete={handleCompleteTask}
        />
      </section>


    </div>
  );
}
