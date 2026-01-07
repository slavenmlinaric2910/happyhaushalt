import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useRepo } from '../../app/providers/RepoProvider';
import { Card } from '../../core/ui/Card';
import styles from './ChoresPage.module.css';

export function ChoresPage() {
  const repo = useRepo();
  const navigate = useNavigate();

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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Chores</h1>
      <div className={styles.choresList}>
        {chores.length === 0 ? (
          <p className={styles.empty}>No chores yet</p>
        ) : (
          chores.map((chore) => (
            <Card
              key={chore.id}
              className={styles.choreCard}
              onClick={() => navigate(`/chores/${chore.id}`)}
            >
              <h3 className={styles.choreName}>{chore.name}</h3>
              <p className={styles.choreArea}>{chore.area}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

