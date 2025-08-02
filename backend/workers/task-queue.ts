import { ActionCard, ToolResult } from '../../shared/types';
import { ToolRunner } from '../services/tool-runner';

interface QueuedTask {
  id: string;
  projectId: string;
  action: ActionCard;
  priority: number;
  userId: string;
  userPlan: 'free' | 'paid';
  headers: Record<string, string>;
  createdAt: Date;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: ToolResult;
}

export class TaskQueue {
  private queue: QueuedTask[] = [];
  private running: Map<string, QueuedTask> = new Map();
  private maxConcurrent = 3;
  private isProcessing = false;
  private toolRunner: ToolRunner;

  constructor(toolRunner: ToolRunner) {
    this.toolRunner = toolRunner;
  }

  async enqueueAction(
    projectId: string,
    action: ActionCard,
    userId: string,
    userPlan: 'free' | 'paid',
    headers: Record<string, string> = {}
  ): Promise<string> {
    const task: QueuedTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      action,
      priority: this.calculatePriority(userPlan, action),
      userId,
      userPlan,
      headers,
      createdAt: new Date(),
      status: 'queued'
    };

    this.queue.push(task);
    this.sortQueue();

    console.log(`Enqueued task ${task.id} for action: ${action.tool} on ${action.target}`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return task.id;
  }

  private calculatePriority(userPlan: 'free' | 'paid', action: ActionCard): number {
    let priority = 0;

    // Paid users get higher priority
    if (userPlan === 'paid') {
      priority += 100;
    }

    // Higher confidence actions get priority
    priority += Math.floor(action.confidence * 10);

    // Critical tools get priority
    if (['nmap', 'trufflehog'].includes(action.tool)) {
      priority += 20;
    }

    return priority;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) break;

      this.running.set(task.id, task);
      task.status = 'running';

      // Execute task asynchronously
      this.executeTask(task)
        .then(result => {
          task.result = result;
          task.status = result.success ? 'completed' : 'failed';
          this.running.delete(task.id);
          
          console.log(`Task ${task.id} completed:`, result.success ? 'SUCCESS' : 'FAILED');
          
          // Store result in database
          this.storeTaskResult(task);
          
          // Continue processing queue
          this.processQueue();
        })
        .catch(error => {
          console.error(`Task ${task.id} error:`, error);
          task.status = 'failed';
          task.result = {
            success: false,
            data: null,
            error: error.message,
            execution_time: 0
          };
          this.running.delete(task.id);
          this.processQueue();
        });
    }

    // If no more tasks to process, stop processing
    if (this.queue.length === 0 && this.running.size === 0) {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: QueuedTask): Promise<ToolResult> {
    console.log(`Executing task ${task.id}: ${task.action.tool} on ${task.action.target}`);

    return await this.toolRunner.executeTool(
      task.action.tool,
      task.action.target,
      task.projectId,
      task.userPlan,
      task.headers
    );
  }

  private async storeTaskResult(task: QueuedTask): Promise<void> {
    // TODO: Store in database
    console.log('Storing task result:', {
      taskId: task.id,
      projectId: task.projectId,
      action: task.action,
      result: task.result
    });

    // TODO: Generate findings from tool results
    if (task.result?.success) {
      await this.generateFindings(task);
    }
  }

  private async generateFindings(task: QueuedTask): Promise<void> {
    // TODO: Implement finding generation logic
    // This would analyze tool results and create structured findings
    console.log('Generating findings for task:', task.id);
  }

  // Public methods for monitoring
  getQueueStatus() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      maxConcurrent: this.maxConcurrent,
      isProcessing: this.isProcessing
    };
  }

  getTaskStatus(taskId: string): QueuedTask | null {
    // Check running tasks
    const runningTask = this.running.get(taskId);
    if (runningTask) return runningTask;

    // Check queued tasks
    return this.queue.find(task => task.id === taskId) || null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    // Remove from queue if not started
    const queueIndex = this.queue.findIndex(task => task.id === taskId);
    if (queueIndex >= 0) {
      this.queue.splice(queueIndex, 1);
      return true;
    }

    // Cannot cancel running tasks in this simple implementation
    // TODO: Implement cancellation for running tasks
    return false;
  }

  // Priority adjustment for paid users
  adjustMaxConcurrent(userPlan: 'free' | 'paid'): void {
    if (userPlan === 'paid') {
      this.maxConcurrent = 5; // Higher concurrency for paid users
    }
  }
}