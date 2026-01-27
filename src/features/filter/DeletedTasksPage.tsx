import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useHouseholdRepo } from '../../app/providers/RepoProvider.tsx';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo.ts';
import styles from './DeletedTasksPage.module.css';

const taskRepo = new SupabaseTaskRepo();

type TaskLike = {
  id: string;
  title: string;
  dueDate: string | Date;
  deletedAt: string | Date | null;
};

export function DeletedTasksPage() {
  const householdRepo = useHouseholdRepo();
  const queryClient = useQueryClient();
  const [isPurging, setIsPurging] = useState(false);

  const { data: household } = useQuery({
      queryKey: ['household'],
      queryFn: () => householdRepo.getCurrentHousehold(),
  });

  const purgeAllDeleted = async () => {
      if (!household?.id || isPurging) return;

      const ok = window.confirm('Alle gelöschten Tasks endgültig löschen?');
      if (!ok) return;

      setIsPurging(true);
      try {
        await taskRepo.hardDeleteAllDeletedTasks(household.id);
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        await queryClient.invalidateQueries({ queryKey: ['deletedTasks'] });
      } finally {
        setIsPurging(false);
      }
    };

  const { data: tasks = [] } = useQuery({
    queryKey: ['deletedTasks', household?.id],
    queryFn: async (): Promise<TaskLike[]> => {
      if (!household) return [];

      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);

      const deleted = await taskRepo.listDeletedTasks(household.id, { start, end });

      return deleted.map((t) => ({
        id: String(t.id),
        title: t.title,
        dueDate: t.dueDate,
        deletedAt: t.deletedAt,
      }));
    },
    enabled: !!household,
  });

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const aDate = a.deletedAt ? new Date(a.deletedAt) : new Date(a.dueDate);
        const bDate = b.deletedAt ? new Date(b.deletedAt) : new Date(b.dueDate);
        return bDate.getTime() - aDate.getTime();
      }),
    [tasks],
  );

  if (!sortedTasks.length) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Deleted Tasks</h1>
        <p className={styles.emptyMessage}>No deleted task.</p>
      </div>
    );
  }

  return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Deleted</h2>

          <button
            type="button"
            onClick={purgeAllDeleted}
            disabled={!household?.id || isPurging}
            aria-label="Delete all deleted tasks permanently"
            title="Delete all deleted tasks permanently"
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
              Deleted at {new Date(task.deletedAt || task.dueDate).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}
