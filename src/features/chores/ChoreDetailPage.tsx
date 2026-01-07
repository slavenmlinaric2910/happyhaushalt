import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRepo } from '../../app/providers/RepoProvider';
import { Card } from '../../core/ui/Card';
import styles from './ChoreDetailPage.module.css';

export function ChoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const repo = useRepo();

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => repo.getCurrentHousehold(),
  });

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return repo.listChores(household.id);
    },
    enabled: !!household,
  });

  const chore = chores.find((c) => c.id === id);

  if (!chore) {
    return (
      <div className={styles.page}>
        <p>Chore not found</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Edit Chore</h1>
      <Card className={styles.formCard}>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            defaultValue={chore.name}
            placeholder="Chore name"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Area</label>
          <input
            type="text"
            className={styles.input}
            defaultValue={chore.area}
            placeholder="Area"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Frequency</label>
          <select className={styles.input} defaultValue={chore.frequencyType}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Checklist Items</label>
          <textarea
            className={styles.textarea}
            defaultValue={chore.checklistItems?.join('\n') || ''}
            placeholder="One item per line"
            rows={4}
          />
        </div>
      </Card>
    </div>
  );
}

