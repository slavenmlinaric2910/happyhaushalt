import { Card } from '../../core/ui/Card';
import styles from './HomePage.module.css';

type TaskLike = {
  id: string;
  choreTemplateId: string;
  dueDate: string | Date;
  completedAt?: string | Date | null;
  assignedMemberId?: string;
};

type ChoreInfo = {
  name: string;
  area: string;
};

type MemberInfo = {
  id: string;
  displayName: string;
  color?: string;
};

type TaskListSectionProps = {
  title: string;
  emptyMessage: string;
  tasks: TaskLike[];
  choreById: Map<string, ChoreInfo>;
  memberById?: Map<string, MemberInfo>;
  onToggleComplete: (taskId: string) => void;
};

// einfacher Avatar aus Initialen
function MemberAvatar({ member }: { member?: MemberInfo }) {
  const label = member?.displayName ?? '?';
  const initial = label.charAt(0).toUpperCase();

  // einfache Pastellfarbe, wenn nichts gesetzt ist
  const bg = member?.color ?? '#fde68a'; // warmes Gelb
  return (
    <div className={styles.memberAvatar} aria-label={label}>
      <span
        className={styles.memberAvatarCircle}
        style={{ backgroundColor: bg }}
      >
        {initial}
      </span>
    </div>
  );
}

export function TaskListSection({
                                  title,
                                  emptyMessage,
                                  tasks,
                                  choreById,
                                  memberById,
                                  onToggleComplete,
                                }: TaskListSectionProps) {
  return (
    <>
      <h2 className={styles.sectionHeader}>{title}</h2>
      {tasks.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <div className={styles.tasksList}>
          {tasks.map((task) => {
            const template = choreById.get(task.choreTemplateId);
            const taskTitle = template?.name ?? 'Task';
            const area = template?.area;

            const isCompleted = !!task.completedAt;
            const member =
              task.assignedMemberId && memberById
                ? memberById.get(task.assignedMemberId)
                : undefined;

            const handleClick = () => {
              if (onToggleComplete) {
                onToggleComplete(task.id);
              }
            };

            return (
              <Card
                key={task.id}
                className={styles.taskTile}
                onClick={handleClick}
              >
                <div className={styles.taskContent}>
                  {/* Avatar anstelle der Checkbox */}
                  <MemberAvatar member={member} />

                  <div className={styles.taskInfo}>
                    <h3 className={styles.taskTitle}>{taskTitle}</h3>
                    {area && (
                      <span className={styles.taskArea}>
                        {area}
                        {member ? ` • ${member.displayName}` : null}
                      </span>
                    )}
                  </div>

                  {/* optional kleiner Status-Punkt rechts */}
                  {isCompleted && (
                    <span className={styles.taskStatusDot} aria-hidden="true" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
