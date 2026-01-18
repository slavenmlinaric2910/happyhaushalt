import { Link } from 'react-router-dom';
import { Settings, Plus, CheckCircle2, Circle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepo } from '../../app/providers/RepoProvider';
import { IconButton } from '../../core/ui/IconButton';
import { HouseMoodCard } from './HouseMoodCard';
import { AreaTile } from './AreaTile';
import { Card } from '../../core/ui/Card';
import styles from './HomePage.module.css';

const AREAS = [
  {
    name: 'Kitchen',
    illustration: '/illustrations/area-kitchen.png',
    status: 'good' as const,
    backgroundColor: 'warm' as const,
  },
  {
    name: 'Bathroom',
    illustration: '/illustrations/area-bathroom.png',
    status: 'due-today' as const,
    dueCount: 2,
    backgroundColor: 'blue' as const,
  },
  {
    name: 'Living Room',
    illustration: '/illustrations/area-living-room.png',
    status: 'overdue' as const,
    dueCount: 2,
    backgroundColor: 'mint' as const,
  },
  {
    name: 'General',
    illustration: '/illustrations/area-general.png',
    status: 'good' as const,
    backgroundColor: 'warm' as const,
  },
];

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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', household?.id, today.toISOString()],
    queryFn: async () => {
      if (!household) return [];
      await repo.regenerateTasksIfNeeded(household.id);
      return repo.listTasks(household.id, { start: today, end: tomorrow });
    },
    enabled: !!household,
  });

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

      <section className={styles.tasksSection}>
        <h2 className={styles.sectionHeader}>Today's Tasks</h2>
        {tasks.length === 0 ? (
          <p className={styles.emptyState}>No tasks for today</p>
        ) : (
          <div className={styles.tasksList}>
            {tasks.map((task) => (
              <Card key={task.id} className={styles.taskTile}>
                <div className={styles.taskContent}>
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className={styles.taskCheckbox}
                    aria-label={task.completedAt ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completedAt ? (
                      <CheckCircle2 size={24} className={styles.iconCompleted} />
                    ) : (
                      <Circle size={24} className={styles.iconIncomplete} />
                    )}
                  </button>
                  <div className={styles.taskInfo}>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    {task.area && (
                      <span className={styles.taskArea}>{task.area}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className={styles.areasSection}>
        <h2 className={styles.areasHeader}>Areas</h2>
        <div className={styles.areasGrid}>
          {AREAS.map((area) => (
            <AreaTile
              key={area.name}
              name={area.name}
              illustration={area.illustration}
              status={area.status}
              dueCount={area.dueCount}
              backgroundColor={area.backgroundColor}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
