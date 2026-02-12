import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useHouseholdRepo, useMemberRepo, useAreaRepo } from '../../app/providers/RepoProvider';
import { SupabaseChoreRepo } from '../../core/repos/SupabaseChoreRepo';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo';
import styles from './CreateChorePage.module.css';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
] as const;

type FrequencyValue = typeof FREQUENCIES[number]['value'];

const choreRepo = new SupabaseChoreRepo();

const taskRepo = new SupabaseTaskRepo();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDateInputLocal(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function nextDueDate(from: Date, frequency: FrequencyValue): Date {
  const d = startOfDay(from);

  switch (frequency) {
    case 'daily': {
      d.setDate(d.getDate() + 1);
      return d;
    }
    case 'weekly': {
      d.setDate(d.getDate() + 7);
      return d;
    }
    case 'biweekly': {
      d.setDate(d.getDate() + 14);
      return d;
    }
    case 'monthly': {
      d.setMonth(d.getMonth() + 1);
      return startOfDay(d);
    }
    default: {
      return d;
    }
  }
}

export function CreateChorePage() {
  const navigate = useNavigate();
  const householdRepo = useHouseholdRepo();
  const memberRepo = useMemberRepo();
  const areaRepo = useAreaRepo();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<FrequencyValue>('weekly');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areaRepo.listAreas(),
  });

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => householdRepo.getCurrentHousehold(),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return memberRepo.listMembersByHousehold(household.id);
    },
    enabled: !!household,
  });

  // Filter members that have a userId (registered users)
  const assignees = members.filter(
    (member): member is (typeof members)[number] & { userId: string } =>
      Boolean(member.userId)
  );

  const handleAssigneeToggle = (memberId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Create chore mutation
  // Create chore mutation
    const createChoreMutation = useMutation({
      mutationFn: async () => {
        const currentHousehold = await householdRepo.getCurrentHousehold();
        if (!currentHousehold) {
          throw new Error('No household found for current user');
        }

        const choreInput = {
          name: name.trim(),
          frequency,
          rotationMemberIds: selectedAssignees,
          startDate: startDate ? new Date(startDate) : null,
          endDate: dueDate ? new Date(dueDate) : null,
          areaId: areaId,
        };

        return choreRepo.createChore(currentHousehold.id, choreInput);
      },
      onSuccess: async (createdChore) => {
        const currentHousehold = await householdRepo.getCurrentHousehold();
        if (currentHousehold && selectedAssignees.length > 0) {
          // 1. First Task Assignee
          const firstMemberId = selectedAssignees[0];
          const firstAssigneeUserId = assignees.find((m) => m.id === firstMemberId)?.userId ?? null;

          if (firstAssigneeUserId) {
            const firstDueDate = startDate ? parseDateInputLocal(startDate) : startOfDay(new Date());
            const endDateInput = dueDate ? parseDateInputLocal(dueDate) : null;

            // Create the very first task
            await taskRepo.createTask({
              householdId: currentHousehold.id,
              templateId: (createdChore as any).id,
              title: name.trim(),
              dueDate: firstDueDate,
              assignedUserId: firstAssigneeUserId,
              areaId: areaId || undefined,
              status: 'open',
            });

            // 2. Second (Upcoming) Task with Rotation Logic
            const upcomingDueDate = nextDueDate(firstDueDate, frequency);
            const isWithinEndDate = !endDateInput || upcomingDueDate.getTime() <= endDateInput.getTime();

            if (isWithinEndDate) {
              // Pick the next person in the rotation array
              const nextIndex = selectedAssignees.length > 1 ? 1 : 0;
              const secondMemberId = selectedAssignees[nextIndex];
              const secondAssigneeUserId = assignees.find((m) => m.id === secondMemberId)?.userId ?? null;

              await taskRepo.createTask({
                householdId: currentHousehold.id,
                templateId: (createdChore as any).id,
                title: name.trim(),
                dueDate: upcomingDueDate,
                assignedUserId: secondAssigneeUserId || firstAssigneeUserId,
                areaId: areaId || undefined,
                status: 'open',
              });
            }
          }
        }

        // Refresh data and redirect
        await queryClient.invalidateQueries({ queryKey: ['chores'] });
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        navigate('/tasks');
      },
    });

  const handleSubmit = (e: FormEvent) => {
      e.preventDefault();

      if (!name.trim() || !frequency || !areaId || selectedAssignees.length === 0) {
        return;
      }

      createChoreMutation.mutate();
    };

  const isFormValid = name.trim() && frequency && areaId && selectedAssignees.length > 0;

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/tasks')}
          aria-label="Back to tasks"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Create Chore</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="name"
            className={styles.input}
            placeholder="e.g., Vacuum the house"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="frequency" className={styles.label}>
            Frequency <span className={styles.required}>*</span>
          </label>
          <div className={styles.frequencyOptions}>
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.value}
                type="button"
                className={`${styles.frequencyButton} ${frequency === freq.value ? styles.frequencyButtonActive : ''}`}
                onClick={() => setFrequency(freq.value)}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.dateRow}>
          <div className={styles.field}>
            <label htmlFor="startDate" className={styles.label}>
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className={styles.dateInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="dueDate" className={styles.label}>
              End Date
            </label>
            <input
              type="date"
              id="dueDate"
              className={styles.dateInput}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={startDate || today}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="area" className={styles.label}>
            Area <span className={styles.required}>*</span>
          </label>
          <select
            id="area"
            className={styles.select}
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            required
            disabled={areasLoading}
          >
            <option value="" disabled>
              {areasLoading ? 'Loading areas...' : 'Select an area'}
            </option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Assignees <span className={styles.required}>*</span>
          </label>
          <p className={styles.hint}>
            Select one or more members to rotate this chore
          </p>
          <div className={styles.assigneeList}>
            {membersLoading ? (
              <p className={styles.loadingText}>Loading members...</p>
            ) : assignees.length === 0 ? (
              <p className={styles.emptyText}>No members found in household</p>
            ) : (
              assignees.map((member) => (
                <label key={member.id} className={styles.assigneeItem}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedAssignees.includes(member.id)}
                    onChange={() => handleAssigneeToggle(member.id)}
                  />
                  <span className={styles.assigneeName}>{member.displayName}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isFormValid || createChoreMutation.isPending}
        >
          {createChoreMutation.isPending ? 'Creating...' : 'Create Chore'}
        </button>

        {createChoreMutation.isError && (
          <p className={styles.error}>
            Failed to create chore. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
