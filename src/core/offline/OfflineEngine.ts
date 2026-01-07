import { db } from './db';
import type { OfflineOp, OfflineOpType } from '../types';
import { generateId } from '../../lib/utils';
import { logger } from '../../lib/logger';
import { RemoteRepoStub } from '../repos/RemoteRepoStub';

export interface QueueState {
  pending: number;
  failed: number;
  syncing: number;
}

export class OfflineEngine {
  private remoteRepo: RemoteRepoStub;
  private isSyncing = false;
  private syncListeners: Set<() => void> = new Set();

  constructor(remoteRepo: RemoteRepoStub) {
    this.remoteRepo = remoteRepo;
  }

  async enqueue(type: OfflineOpType, payload: Record<string, unknown>): Promise<string> {
    const op: OfflineOp = {
      id: generateId(),
      createdAt: new Date(),
      type,
      payload,
      status: 'pending',
    };

    await db.outbox.add(op);
    logger.log('Enqueued operation', type, op.id);
    this.notifyListeners();

    // Auto-sync if online
    if (navigator.onLine) {
      this.syncNow().catch((err) => {
        logger.error('Auto-sync failed', err);
      });
    }

    return op.id;
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing) {
      logger.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      logger.log('Offline, skipping sync');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const pendingOps = await db.outbox
        .where('status')
        .anyOf(['pending', 'failed'])
        .sortBy('createdAt');

      for (const op of pendingOps) {
        try {
          await db.outbox.update(op.id, { status: 'syncing' });
          this.notifyListeners();

          await this.processOperation(op);

          await db.outbox.update(op.id, { status: 'done' });
          logger.log('Synced operation', op.type, op.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await db.outbox.update(op.id, {
            status: 'failed',
            error: errorMessage,
          });
          logger.error('Failed to sync operation', op.id, error);
        }
        this.notifyListeners();
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processOperation(op: OfflineOp): Promise<void> {
    switch (op.type) {
      case 'COMPLETE_TASK':
        await this.remoteRepo.completeTask(op.payload.taskId as string);
        break;
      case 'CREATE_CHORE':
        await this.remoteRepo.createChore(op.payload as unknown as Parameters<typeof this.remoteRepo.createChore>[0]);
        break;
      case 'UPDATE_CHORE':
        await this.remoteRepo.updateChore(
          op.payload.id as string,
          op.payload as unknown as Parameters<typeof this.remoteRepo.updateChore>[1]
        );
        break;
      case 'ARCHIVE_CHORE':
        await this.remoteRepo.archiveChore(op.payload.id as string);
        break;
      case 'CREATE_HOUSEHOLD':
        await this.remoteRepo.createHousehold(op.payload as unknown as Parameters<typeof this.remoteRepo.createHousehold>[0]);
        break;
      case 'JOIN_HOUSEHOLD':
        await this.remoteRepo.joinHousehold(op.payload.joinCode as string);
        break;
      default:
        throw new Error(`Unknown operation type: ${(op as OfflineOp).type}`);
    }
  }

  async getQueueState(): Promise<QueueState> {
    const [pending, failed, syncing] = await Promise.all([
      db.outbox.where('status').equals('pending').count(),
      db.outbox.where('status').equals('failed').count(),
      db.outbox.where('status').equals('syncing').count(),
    ]);

    return { pending, failed, syncing };
  }

  subscribe(listener: () => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.syncListeners.forEach((listener) => listener());
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

