import { Settings, Plus } from 'lucide-react';
import { IconButton } from '../../core/ui/IconButton';
import { HouseMoodCard } from './HouseMoodCard';
import { AreaTile } from './AreaTile';
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
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Home</h1>
        <IconButton
          icon={<Settings size={20} />}
          variant="ghost"
          size="md"
          aria-label="Settings"
        />
      </header>

      <HouseMoodCard status="good" message="All good — nothing overdue." />

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

      <div className={styles.fabContainer}>
        <IconButton
          icon={<Plus size={24} />}
          variant="fab"
          size="lg"
          aria-label="Add new"
          className={styles.fab}
        />
      </div>
    </div>
  );
}
