import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useHouseholdRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { SupabaseTaskRepo } from '../../core/repos/SupabaseTaskRepo';
import { supabase } from '../../lib/supabase/client';
import styles from './CreateTaskPage.module.css';

// Predefined areas for the household
const AREAS = [
  'Kitchen',
  'Living Room',
  'Bathroom',
  'Bedroom',
  'Balcony',
  'Office',
  'Hallway',
  'Garage',
  'Garden',
  'Other',
];
const taskRepo = new SupabaseTaskRepo();


export function CreateTaskPage() {
  const navigate = useNavigate();
  const householdRepo = useHouseholdRepo();
  const memberRepo = useMemberRepo();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

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

  const assignees = members.filter(
    (member): member is (typeof members)[number] & { userId: string } =>
      Boolean(member.userId)
  );

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      // Get current user from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      // Get current household
      const currentHousehold = await householdRepo.getCurrentHousehold();
      if (!currentHousehold) {
        throw new Error('No household found for current user');
      }

      // Create task using SupabaseTaskRepo
      const taskInput = {
        householdId: currentHousehold.id,
        templateId: null,
        title: name.trim(),
        dueDate: new Date(dueDate),
        assignedUserId: assigneeId,
        status: 'open' as const,
      };

      return taskRepo.createTask(taskInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/', { state: { taskCreated: true } });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !dueDate || !area || !assigneeId) {
      return;
    }

    createTaskMutation.mutate();
  };

  const isFormValid = name.trim() && dueDate && area && assigneeId;

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
        <h1 className={styles.title}>Create Task</h1>
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
            placeholder="e.g., Clean the kitchen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="dueDate" className={styles.label}>
            Due Date <span className={styles.required}>*</span>
          </label>
          <input
            type="date"
            id="dueDate"
            className={styles.dateInput}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={today}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="area" className={styles.label}>
            Area <span className={styles.required}>*</span>
          </label>
          <select
            id="area"
            className={styles.select}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          >
            <option value="" disabled>
              Select an area
            </option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="assignee" className={styles.label}>
            Assignee <span className={styles.required}>*</span>
          </label>
          <select
            id="assignee"
            className={styles.select}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            required
            disabled={membersLoading || assignees.length === 0}
          >
            <option value="" disabled>
              {membersLoading ? 'Loading members...' : 'Select a member'}
            </option>
            {assignees.map((member) => (
              <option key={member.id} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isFormValid || createTaskMutation.isPending}
        >
          {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
        </button>

        {createTaskMutation.isError && (
          <p className={styles.error}>
            Failed to create task. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
