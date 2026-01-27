import styles from './HomePage.module.css';
import { SwipeableTaskItem } from './SwipeableTaskItem';
import { AvatarId } from '@/features/onboarding/avatars.ts';

type TaskLike = {
  id: string;
  choreTemplateId: string;
  dueDate: string | Date;
  completedAt?: string | Date | null;
  assignedMemberId?: string;
  title?: string;
  name?: string;
};

type ChoreInfo = {
  name: string;
  areaId?: string;
  frequency?: string;
};

type MemberInfo = {
  id: string;
  displayName: string;
  color?: string;
  avatarId?: AvatarId;
};

type TaskListSectionProps = {
  title: string;
  emptyMessage: string;
  tasks: TaskLike[];
  choreById: Map<string, ChoreInfo>;
  memberById?: Map<string, MemberInfo>;
  avatarSrcById?: Map<AvatarId, string>;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (taskId: string) => void;

  onDeleteTask: (taskId: string) => Promise<void>;
};

// einfacher Avatar aus Initialen
function MemberAvatar({
                        member,
                        avatarSrcById,
                      }: {
  member?: MemberInfo;
  avatarSrcById?: Map<AvatarId, string>;
}) {
  const label = member?.displayName ?? '?';
  const src =
    member?.avatarId && avatarSrcById ? avatarSrcById.get(member.avatarId) : undefined;

  const sizePx = 40;

  if (src) {
    return (
      <div
        className={styles.memberAvatar}
        aria-label={label}
        style={{ width: sizePx, height: sizePx, flex: '0 0 auto' }}
      >
        <img
          src={src}
          alt={label}
          className={styles.memberAvatarCircle}
          style={{
            width: sizePx,
            height: sizePx,
            borderRadius: 9999,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Fallback (sollte selten sein, falls avatarId fehlt)
  const initial = label.charAt(0).toUpperCase();
  return (
    <div className={styles.memberAvatar} aria-label={label}>
      <span className={styles.memberAvatarCircle} style={{ backgroundColor: '#fde68a' }}>
        {initial}
      </span>
    </div>
  );
}

function formatFrequency(freq?: string) {
  if (!freq) return '';
  switch (freq) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'biweekly':
      return 'Every 2 Weeks';
    case 'monthly':
      return 'Monthly';
    default:
      return freq;
  }
}

export function TaskListSection({
  title,
  emptyMessage,
  tasks,
  choreById,
  memberById,
  avatarSrcById,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
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
            const userTitle = task.title?.trim();
            const taskTitle =
              userTitle && userTitle.length > 0 ? userTitle : (template?.name ?? 'Task');

            const member =
              task.assignedMemberId && memberById
                ? memberById.get(task.assignedMemberId)
                : undefined;

            const isChore = Boolean(template);
            const subtitleBase = member?.displayName?.trim();

            const repeatedText =
                          isChore && template?.frequency
                            ? `Repeated ${formatFrequency(template.frequency)}`
                            : undefined;

            const subtitle = isChore
                          ? [subtitleBase, 'Chore', repeatedText].filter(Boolean).join(' · ')
                          : subtitleBase;

            return (
              <SwipeableTaskItem
                key={task.id}
                id={task.id}
                title={taskTitle}
                subtitle={subtitle}
                leftIcon={<MemberAvatar member={member} avatarSrcById={avatarSrcById} />}
                onComplete={() => onToggleComplete(task.id)}
                onDelete={() => {
                  void onDeleteTask(task.id);
                }}
                onEdit={() => onEditTask(task.id)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
