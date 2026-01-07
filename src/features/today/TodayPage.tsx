import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepo } from '../../app/providers/RepoProvider';
import { Card } from '../../core/ui/Card';
import { Chip } from '../../core/ui/Chip';
import { CheckCircle2, Circle } from 'lucide-react';
import { formatDateShort } from '../../lib/utils';
import styles from './TodayPage.module.css';

export function TodayPage() {
  const repo = useRepo();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

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

  const filteredTasks = filter === 'mine' ? tasks.filter((t) => t.assignedMemberId) : tasks;

  const handleComplete = async (taskId: string) => {
    await repo.completeTask(taskId);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Today</h1>
      <div className={styles.filters}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All tasks
        </Chip>
        <Chip active={filter === 'mine'} onClick={() => setFilter('mine')}>
          My tasks
        </Chip>
      </div>
      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <p className={styles.empty}>No tasks for today</p>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={styles.taskCard}>
              <button
                className={styles.taskCheckbox}
                onClick={() => handleComplete(task.id)}
                disabled={task.status === 'completed'}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : (
                  <Circle size={24} color="#9ca3af" />
                )}
              </button>
              <div className={styles.taskContent}>
                <h3 className={styles.taskName}>Chore #{task.choreTemplateId.slice(0, 8)}</h3>
                <p className={styles.taskDate}>{formatDateShort(new Date(task.dueDate))}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

