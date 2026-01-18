import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { Chip } from '../../core/ui/Chip';
import { HouseMoodCard } from '../home/HouseMoodCard';
import { TaskCard } from './TaskCard';
import { groupTasks } from './taskGrouping';
import { calculateHouseMood } from './houseMood';
import styles from './TasksPage.module.css';

export function TasksPage() {
  const repo = useRepo();
  const memberRepo = useMemberRepo();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => repo.getCurrentHousehold(),
  });

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => memberRepo.getCurrentMember(),
    enabled: !!household,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return repo.listMembers(household.id);
    },
    enabled: !!household,
  });

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return repo.listChores(household.id);
    },
    enabled: !!household,
  });

  // Fetch tasks for a wider range (past 7 days + next 30 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7); // Include past week for overdue
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30); // Next 30 days for upcoming

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', household?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!household) return [];
      await repo.regenerateTasksIfNeeded(household.id);
      return repo.listTasks(household.id, { start: startDate, end: endDate });
    },
    enabled: !!household,
  });

  // Filter tasks based on "Mine" vs "All"
  const filteredTasks =
    filter === 'mine' && currentMember
      ? tasks.filter((t) => t.assignedMemberId === currentMember.id)
      : tasks;

  // Group tasks
  const grouped = groupTasks(filteredTasks);
  const houseMood = calculateHouseMood(grouped);

  const handleComplete = async (taskId: string) => {
    await repo.completeTask(taskId);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tasks</h1>

      <div className={styles.filters}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All tasks
        </Chip>
        <Chip active={filter === 'mine'} onClick={() => setFilter('mine')}>
          My tasks
        </Chip>
      </div>

      <HouseMoodCard status={houseMood.status} message={houseMood.message} />

      {/* Overdue Section */}
      {grouped.overdue.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeader}>
            Overdue
            <span className={styles.count}>({grouped.overdue.length})</span>
          </h2>
          <div className={styles.tasksList}>
            {grouped.overdue.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                chores={chores}
                members={members}
                onComplete={handleComplete}
                onClick={() => handleTaskClick(task.id)}
                showAssignee={filter === 'all'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Due Today Section */}
      {grouped.dueToday.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeader}>
            Due today
            <span className={styles.count}>({grouped.dueToday.length})</span>
          </h2>
          <div className={styles.tasksList}>
            {grouped.dueToday.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                chores={chores}
                members={members}
                onComplete={handleComplete}
                onClick={() => handleTaskClick(task.id)}
                showAssignee={filter === 'all'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Section */}
      {grouped.upcoming.length > 0 && (
        <section className={styles.section}>
          <button
            className={styles.sectionHeaderButton}
            onClick={() => setUpcomingExpanded(!upcomingExpanded)}
          >
            <h2 className={styles.sectionHeader}>
              Upcoming
              <span className={styles.count}>({grouped.upcoming.length})</span>
            </h2>
            {upcomingExpanded ? (
              <ChevronUp size={20} color="#6b7280" />
            ) : (
              <ChevronDown size={20} color="#6b7280" />
            )}
          </button>
          {upcomingExpanded && (
            <div className={styles.tasksList}>
              {grouped.upcoming.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  chores={chores}
                  members={members}
                  onComplete={handleComplete}
                  onClick={() => handleTaskClick(task.id)}
                  showAssignee={filter === 'all'}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            {filter === 'mine' ? "You don't have any tasks." : 'No tasks yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
