import { db } from '../core/offline/db';
import { generateId } from './utils';
import type { Household, Member, ChoreTemplate, TaskInstance } from '../core/types';
import type { AvatarId } from '../features/onboarding/avatars';

const SEEDED_KEY = 'chores_seeded_v1';

export async function seedDemoData(): Promise<void> {
  // Check if already seeded
  const seeded = localStorage.getItem(SEEDED_KEY);
  if (seeded === 'true') {
    return;
  }

  // Create household
  const household: Household = {
    id: generateId(),
    name: 'Demo Household',
    joinCode: 'DEMO01',
    createdAt: new Date(),
  };

  await db.households.add(household);

  // Create members
  const members: Member[] = [
    {
      id: generateId(),
      householdId: household.id,
      displayName: 'Alice',
      avatarId: 'broom-buddy' as AvatarId,
    },
    {
      id: generateId(),
      householdId: household.id,
      displayName: 'Bob',
      avatarId: 'vacuum-vroom' as AvatarId,
    },
    {
      id: generateId(),
      householdId: household.id,
      displayName: 'Charlie',
      avatarId: 'sponge-pal' as AvatarId,
    },
  ];

  await db.members.bulkAdd(members);

  // Create chore templates
  const chores: ChoreTemplate[] = [
    {
      id: generateId(),
      householdId: household.id,
      name: 'Dishes',
      area: 'Kitchen',
      frequencyType: 'daily',
      frequencyValue: 1,
      rotationCursor: 0,
      isArchived: false,
      checklistItems: ['Load dishwasher', 'Run cycle', 'Unload dishwasher'],
    },
    {
      id: generateId(),
      householdId: household.id,
      name: 'Vacuum Living Room',
      area: 'Living Room',
      frequencyType: 'weekly',
      frequencyValue: 1,
      rotationCursor: 1,
      isArchived: false,
      checklistItems: ['Move furniture', 'Vacuum floor', 'Vacuum under cushions'],
    },
    {
      id: generateId(),
      householdId: household.id,
      name: 'Bathroom Clean',
      area: 'Bathroom',
      frequencyType: 'weekly',
      frequencyValue: 1,
      rotationCursor: 2,
      isArchived: false,
      checklistItems: ['Clean toilet', 'Clean sink', 'Clean mirror', 'Mop floor'],
    },
  ];

  await db.choreTemplates.bulkAdd(chores);

  // Create some tasks for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks: TaskInstance[] = chores.map((chore, index) => ({
    id: generateId(),
    householdId: household.id,
    choreTemplateId: chore.id,
    dueDate: today,
    assignedMemberId: members[index % members.length].id,
    status: 'pending',
    completedAt: null,
  }));

  await db.tasks.bulkAdd(tasks);

  // Mark as seeded
  localStorage.setItem(SEEDED_KEY, 'true');
}

