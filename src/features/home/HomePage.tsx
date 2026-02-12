import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useHouseholdRepo, useChoreRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { HouseMoodCard } from './HouseMoodCard';
import styles from './HomePage.module.css';
import { TaskListSection } from './TaskListSection';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo';
import { useAuth } from '../../app/providers/AuthProvider';
import { CompletedTasksPage } from '@/features/filter/CompletedTasksPage';
import { DeletedTasksPage } from '@/features/filter/DeletedTasksPage';
import { AVATARS, type AvatarId } from '../onboarding/avatars';
import { ConfirmDialog } from '../../core/ui/ConfirmDialog';

const taskRepo = new SupabaseTaskRepo();

type TaskLike = {
  id: string;
  choreTemplateId: string;
  dueDate: string | Date;
  completedAt?: string | Date | null;
};

type HomeView = 'home' | 'completed' | 'deleted';
type TaskScope = 'mine' | 'all';

// Hilfsfunktion außerhalb des Components
function groupTasksByDueDate<T extends TaskLike>(tasks: T[], today: Date) {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const overdueTasks: T[] = [];
  const todayTasks: T[] = [];
  const upcomingTasks: T[] = [];

  for (const task of tasks) {
    if (task.completedAt) continue;

    const dueTime = new Date(task.dueDate).setHours(0, 0, 0, 0);
    const todayTime = startOfToday.getTime();
    const tomorrowTime = startOfTomorrow.getTime();

    if (dueTime < todayTime) {
      overdueTasks.push(task);
    } else if (dueTime === todayTime) {
      todayTasks.push(task);
    } else if (dueTime >= tomorrowTime) {
      upcomingTasks.push(task);
    }
  }

  return { overdueTasks, todayTasks, upcomingTasks };
}

export function HomePage() {
  const householdRepo = useHouseholdRepo();
  const choreRepo = useChoreRepo();
  const memberRepo = useMemberRepo();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [view, setView] = useState<HomeView>('home');
  const [scope, setScope] = useState<TaskScope>('mine');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const isCompletedSelected = view === 'completed';
  const isDeletedSelected = view === 'deleted';
  const isMineSelected = view === 'home' && scope === 'mine';
  const isAllSelected = view === 'home' && scope === 'all';
  const pageRef = useRef<HTMLDivElement | null>(null);


  useLayoutEffect(() => {
    // 1) Falls der Scroll im Container passiert:
    pageRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // 2) Falls der Scroll im Window passiert:
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [view, scope]);

  useEffect(() => {
    if (!isFilterOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const clickedButton = filterButtonRef.current?.contains(target);
      const clickedMenu = filterMenuRef.current?.contains(target);

      if (!clickedButton && !clickedMenu) setIsFilterOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFilterOpen]);

  const applyFilter = (key: 'completed' | 'deleted' | 'mine' | 'all') => {
    if (key === 'completed') setView('completed');
    if (key === 'deleted') setView('deleted');
    if (key === 'mine') {
      setView('home');
      setScope('mine');
    }
    if (key === 'all') {
      setView('home');
      setScope('all');
    }
    setIsFilterOpen(false);
  };

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => householdRepo.getCurrentHousehold(),
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1000000);
    return d;
  }, [today]);

  const { data: tasksFromQuery = [] } = useQuery({
    queryKey: ['tasks', household?.id, today.toISOString()],
    queryFn: async () => {
      if (!household) return [];
      await taskRepo.regenerateTasksIfNeeded();
      return taskRepo.listTasks(household.id, { start: today, end: tomorrow });
    },
    enabled: !!household,
  });

  // Filter tasks by scope: "mine" shows only tasks assigned to the current user,
  // "all" shows every task in the household.
  const filteredTasks = useMemo(() => {
    const allTasks = tasksFromQuery as (TaskLike & { assignedMemberId?: string | null })[];
    if (scope === 'all' || !user) return allTasks;

    return allTasks.filter((task) => task.assignedMemberId === user.id);
  }, [tasksFromQuery, scope, user]);

  const { overdueTasks: householdOverdueTasks, todayTasks: householdTodayTasks } = useMemo(
    () => groupTasksByDueDate(tasksFromQuery as TaskLike[], today),
    [tasksFromQuery, today],
  );

  const { overdueTasks, todayTasks, upcomingTasks } = useMemo(
    () => groupTasksByDueDate(filteredTasks as TaskLike[], today),
    [filteredTasks, today],
  );

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return choreRepo.listChores(household.id);
    },
    enabled: !!household,
  });

  const choreById = useMemo(() => {
    const map = new Map<string, { name: string; area: string; frequency?: string }>();
    for (const c of chores) {
      map.set(c.id, { name: c.name, area: c.areaId ?? '', frequency: (c as any).frequency?? undefined,
        });
    }

    return map;
  }, [chores]);

  const [confirmState, setConfirmState] = useState<
      | null
      | {
          kind: 'complete' | 'delete';
          taskId: string;
        }
    >(null);
    const [confirmBusy, setConfirmBusy] = useState(false);

  const handleCompleteTask = async (taskId: string) => {
      setConfirmState({ kind: 'complete', taskId });
    };

    const handleDeleteTask = async (taskId: string) => {
      setConfirmState({ kind: 'delete', taskId });
    };

    const runConfirmedAction = async () => {
      if (!confirmState) return;

      setConfirmBusy(true);
      try {
        if (confirmState.kind === 'complete') {
          await taskRepo.completeTask(confirmState.taskId);
          await queryClient.invalidateQueries({ queryKey: ['tasks'] });
          await queryClient.invalidateQueries({ queryKey: ['completedTasks'] });
        }

        if (confirmState.kind === 'delete') {
          await taskRepo.deleteTask(confirmState.taskId);
          await queryClient.invalidateQueries({ queryKey: ['tasks'] });
          await queryClient.invalidateQueries({ queryKey: ['deletedTasks'] });
        }

        setConfirmState(null);
      } finally {
        setConfirmBusy(false);
      }
    };

  const handleEditTask = (taskId: string) => {
    console.log('edit task', taskId);
  };

  const { data: members = [] } = useQuery({
    queryKey: ['members', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return memberRepo.listMembersByHousehold(household.id);
    },
    enabled: !!household,
  });

  const avatarSrcById = useMemo(() => {
    const map = new Map<AvatarId, string>();
    for (const a of AVATARS) {
      map.set(a.id, a.src);
    }
    return map;
  }, []);

  const memberById = useMemo(() => {
    const map = new Map<string, { id: string; displayName: string; avatarId?: AvatarId }>();

    for (const m of members as any[]) {
      const memberInfo = {
        id: String(m.id),
        displayName: String(m.displayName ?? ''),
        avatarId: m.avatarId as AvatarId | undefined,
      };

      // Wichtig: Tasks nutzen assignedMemberId = assigned_user_id (UserId).
      // Wir mappen deshalb sowohl userId als auch id als Key (robust).
      if (m.userId) map.set(String(m.userId), memberInfo);
      map.set(String(m.id), memberInfo);
    }

    return map;
  }, [members]);

  if (view === 'completed') {
    return (
      <div className={styles.page} ref={pageRef} key="completed">
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <button type="button" className={styles.tab} onClick={() => setView('home')}>
          Back
        </button>
      </header>

      <CompletedTasksPage />
    </div>
  );
} else if (view === 'deleted') {
  return (
        <div className={styles.page} ref={pageRef} key="deleted">
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        <button type="button" className={styles.tab} onClick={() => setView('home')}>
          Back
        </button>
      </header>
      <DeletedTasksPage />
    </div>
  );
}

  return (
    <div className={styles.page} ref={pageRef} key="home">
      <header className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
      </header>

      <HouseMoodCard
        status={householdOverdueTasks.length > 0 ? 'needs-attention' : 'good'}
        dueToday={householdTodayTasks.length}
        overdue={householdOverdueTasks.length}
      />

      <div className={styles.filterRow}>
        <div className={styles.tabs}>
          <div className={styles.filterWrap}>
            <button
              ref={filterButtonRef}
              type="button"
              className={styles.filterButton}
              onClick={() => setIsFilterOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isFilterOpen}
              aria-controls="task-filter-menu"
            >
              Filter <span className={styles.filterChevron} aria-hidden="true">▾</span>
            </button>

            {isFilterOpen && (
              <div
                id="task-filter-menu"
                ref={filterMenuRef}
                className={styles.filterMenu}
                role="menu"
                aria-label="Filter"
              >
                <button
                  type="button"
                  className={styles.filterOption}
                  onClick={() => applyFilter('completed')}
                  role="menuitemradio"
                  aria-checked={isCompletedSelected}
                >
                  Completed
                </button>
                <button
                  type="button"
                  className={styles.filterOption}
                  onClick={() => applyFilter('deleted')}
                  role="menuitemradio"
                  aria-checked={isDeletedSelected}
                >
                  Deleted
                </button>
                <button
                  type="button"
                  className={styles.filterOption}
                  onClick={() => applyFilter('mine')}
                  role="menuitemradio"
                  aria-checked={isMineSelected}
                >
                  Mine
                </button>
                <button
                  type="button"
                  className={styles.filterOption}
                  onClick={() => applyFilter('all')}
                  role="menuitemradio"
                  aria-checked={isAllSelected}
                >
                  All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className={styles.tasksSection}>
        <TaskListSection
          title="Due today"
          emptyMessage="No tasks for today"
          tasks={todayTasks}
          choreById={choreById}
          memberById={memberById}
          avatarSrcById={avatarSrcById}
          onToggleComplete={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
        <TaskListSection
          title="Upcoming"
          emptyMessage="No upcoming tasks"
          tasks={upcomingTasks}
          choreById={choreById}
          memberById={memberById}
          avatarSrcById={avatarSrcById}
          onToggleComplete={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
        <TaskListSection
          title="Overdue"
          emptyMessage="No overdue tasks"
          tasks={overdueTasks}
          choreById={choreById}
          memberById={memberById}
          avatarSrcById={avatarSrcById}
          onToggleComplete={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      </section>

      <ConfirmDialog
              open={confirmState !== null}
              title={
                confirmState?.kind === 'delete'
                  ? 'Aufgabe löschen?'
                  : 'Als erledigt markieren?'
              }
              description={
                confirmState?.kind === 'delete'
                  ? 'Diese Aktion kann später in „Deleted" eingesehen werden.'
                  : 'Die Aufgabe wird aus „Due today" entfernt und erscheint unter „Completed".'
              }
              confirmLabel={confirmState?.kind === 'delete' ? 'Löschen' : 'Erledigt'}
              cancelLabel="Abbrechen"
              confirmVariant={confirmState?.kind === 'delete' ? 'secondary' : 'primary'}
              confirmDisabled={confirmBusy}
              onCancel={() => {
                if (confirmBusy) return;
                setConfirmState(null);
              }}
              onConfirm={() => {
                void runConfirmedAction();
              }}
            />

    </div>
  );
}
