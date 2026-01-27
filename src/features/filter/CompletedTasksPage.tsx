import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useHouseholdRepo } from '../../app/providers/RepoProvider.tsx';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo.ts';
import styles from './CompletedTasksPage.module.css';

const taskRepo = new SupabaseTaskRepo();

type TaskLike = {
  id: string;
  title: string;
  dueDate: string | Date;
  completedAt: string | Date | null;
};

export function CompletedTasksPage() {
  const householdRepo = useHouseholdRepo();

  const queryClient = useQueryClient();
  const [isPurging, setIsPurging] = useState(false);

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => householdRepo.getCurrentHousehold(),
  });

   const purgeAllCompleted = async () => {
      if (!household?.id || isPurging) return;

      const ok = window.confirm('Alle erledigten Tasks endgültig löschen?');
      if (!ok) return;

      setIsPurging(true);
      try {
        await taskRepo.hardDeleteAllCompletedTasks(household.id);
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        await queryClient.invalidateQueries({ queryKey: ['completedTasks'] });
      } finally {
        setIsPurging(false);
      }
    };

  const { data: tasks = [] } = useQuery({
    queryKey: ['completedTasks', household?.id],
    queryFn: async (): Promise<TaskLike[]> => {
      if (!household) return [];

      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);

      const allInRange = await taskRepo.listTasks(household.id, { start, end });

      return allInRange
        .filter((t: any) => t.status === 'done' || !!t.completedAt)
        .map((t: any) => ({
          id: String(t.id),
          title: typeof t.title === 'string' ? t.title : 'Task',
          dueDate: t.dueDate,
          completedAt: t.completedAt ?? null,
        }));
    },
    enabled: !!household,
  });

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const aDate = a.completedAt ? new Date(a.completedAt) : new Date(a.dueDate);
        const bDate = b.completedAt ? new Date(b.completedAt) : new Date(b.dueDate);
        return bDate.getTime() - aDate.getTime();
      }),
    [tasks],
  );

  if (!sortedTasks.length) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Completed Tasks</h1>
        <p className={styles.emptyMessage}>No completed tasks yet.</p>
      </div>
    );
  }

  return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Completed</h2>

          <button
            type="button"
            onClick={purgeAllCompleted}
            disabled={!household?.id || isPurging}
            aria-label="Delete all completed tasks permanently"
            title="Delete all completed tasks permanently"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 6,
              cursor: isPurging ? 'not-allowed' : 'pointer',
              opacity: isPurging ? 0.6 : 1,
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>

    <div className={styles.page}>
      <ul className={styles.list}>
        {sortedTasks.map((task) => (
          <li key={task.id} className={styles.item}>
            <div className={styles.itemTitle}>{task.title}</div>
            <div className={styles.itemSubtitle}>
              Completed at {new Date(task.completedAt || task.dueDate).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}
