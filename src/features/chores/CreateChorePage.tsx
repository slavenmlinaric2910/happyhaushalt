import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useHouseholdRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { SupabaseChoreRepo } from '../../core/repos/SupabaseChoreRepo';
import styles from './CreateChorePage.module.css';

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

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
] as const;

type FrequencyValue = typeof FREQUENCIES[number]['value'];

const choreRepo = new SupabaseChoreRepo();

export function CreateChorePage() {
  const navigate = useNavigate();
  const householdRepo = useHouseholdRepo();
  const memberRepo = useMemberRepo();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<FrequencyValue>('weekly');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

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
  const createChoreMutation = useMutation({
    mutationFn: async () => {
      // Get current household
      const currentHousehold = await householdRepo.getCurrentHousehold();
      if (!currentHousehold) {
        throw new Error('No household found for current user');
      }

      // Create chore using SupabaseChoreRepo
      const choreInput = {
        name: name.trim(),
        frequency,
        rotationMemberIds: selectedAssignees,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        area,
      };

      return choreRepo.createChore(currentHousehold.id, choreInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      navigate('/tasks');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !frequency || !area || selectedAssignees.length === 0) {
      return;
    }

    createChoreMutation.mutate();
  };

  const isFormValid = name.trim() && frequency && area && selectedAssignees.length > 0;

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
