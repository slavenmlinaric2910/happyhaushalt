import Dexie, { Table } from 'dexie';
import type {
  Household,
  Member,
  ChoreTemplate,
  TaskInstance,
  OfflineOp,
} from '../types';

export class ChoresDatabase extends Dexie {
  households!: Table<Household, string>;
  members!: Table<Member, string>;
  choreTemplates!: Table<ChoreTemplate, string>;
  tasks!: Table<TaskInstance, string>;
  outbox!: Table<OfflineOp, string>;

  constructor() {
    super('ChoresDB');
    this.version(1).stores({
      households: 'id, joinCode',
      members: 'id, householdId',
      choreTemplates: 'id, householdId, isArchived',
      tasks: 'id, householdId, choreTemplateId, dueDate, status',
      outbox: 'id, createdAt, status',
    });
  }
}

export const db = new ChoresDatabase();

