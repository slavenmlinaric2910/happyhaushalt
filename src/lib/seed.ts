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
  const now = new Date();
  const chores: ChoreTemplate[] = [
    {
      id: generateId(),
      householdId: household.id,
      name: 'Dishes',
      frequency: 'daily',
      active: true,
      rotationMemberIds: [members[0].id],
      dueDate: null,
      area: 'Kitchen',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      householdId: household.id,
      name: 'Vacuum Living Room',
      frequency: 'weekly',
      active: true,
      rotationMemberIds: [members[1].id],
      dueDate: null,
      area: 'Living Room',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      householdId: household.id,
      name: 'Bathroom Clean',
      frequency: 'weekly',
      active: true,
      rotationMemberIds: [members[2 % members.length].id],
      dueDate: null,
      area: 'Bathroom',
      createdAt: now,
      updatedAt: now,
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

