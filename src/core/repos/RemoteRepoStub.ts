import type {
  Household,
  ChoreTemplate,
} from '../types';
import { logger } from '../../lib/logger';

// Stub implementation that simulates a remote backend
// In production, this would make actual HTTP requests
export class RemoteRepoStub {
  async createHousehold(data: { name: string; joinCode: string }): Promise<Household> {
    logger.log('[Remote] createHousehold', data);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id: `remote-${Date.now()}`,
      name: data.name,
      joinCode: data.joinCode,
      createdAt: new Date(),
    };
  }

  async joinHousehold(joinCode: string): Promise<Household> {
    logger.log('[Remote] joinHousehold', joinCode);
    await new Promise((resolve) => setTimeout(resolve, 300));
    // In real implementation, this would fetch from server
    throw new Error('Not implemented in stub');
  }

  async completeTask(taskId: string): Promise<void> {
    logger.log('[Remote] completeTask', taskId);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  async createChore(data: ChoreTemplate): Promise<ChoreTemplate> {
    logger.log('[Remote] createChore', data);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return data;
  }

  async updateChore(id: string, data: Partial<ChoreTemplate>): Promise<ChoreTemplate> {
    logger.log('[Remote] updateChore', id, data);
    await new Promise((resolve) => setTimeout(resolve, 300));
    // In real implementation, this would merge with existing
    return data as ChoreTemplate;
  }

  async archiveChore(id: string): Promise<void> {
    logger.log('[Remote] archiveChore', id);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

