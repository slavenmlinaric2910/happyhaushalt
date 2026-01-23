import { SwipeableTaskItem } from './SwipeableTaskItem';
import styles from './TaskListSection.module.css';

// Falls du TaskLike schon an anderer Stelle definiert hast,
// kannst du diesen Typ hier weglassen und den bestehenden importieren.
type TaskLike = {
  id: string;
  choreTemplateId: string;
  dueDate: string | Date;
  completedAt?: string | Date | null;
};

type TaskListSectionProps = {
  title: string;
  emptyMessage: string;
  tasks: TaskLike[];
  choreById: Map<string, { name: string; area: string }>;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
};

export function TaskListSection({
                                  title,
                                  emptyMessage,
                                  tasks,
                                  choreById,
                                  onToggleComplete,
                                  onDeleteTask,
                                  onEditTask,
                                }: TaskListSectionProps) {
  if (!tasks.length) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.list}>
        {tasks.map((task) => {
          const chore = choreById.get(task.choreTemplateId);
          const titleText = chore?.name ?? 'Task';
          const subtitleText = chore?.area
            ? `${chore.area} – fällig am ${new Date(task.dueDate).toLocaleDateString()}`
            : `Fällig am ${new Date(task.dueDate).toLocaleDateString()}`;

          return (
            <SwipeableTaskItem
              key={task.id}
              id={task.id}
              title={titleText}
              subtitle={subtitleText}
              onComplete={onToggleComplete}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
            />
          );
        })}
      </div>
    </section>
  );
}
