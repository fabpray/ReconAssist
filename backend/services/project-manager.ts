import { Project, InsertProject } from '../../shared/types';
import { TierEnforcer } from './tier-enforcer';

export class ProjectManager {
  private tierEnforcer: TierEnforcer;
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.tierEnforcer = new TierEnforcer();
  }

  async createProject(
    userId: number,
    name: string,
    target: string,
    scope: string[],
    plan: 'free' | 'paid' = 'free'
  ): Promise<Project> {
    
    // Check tier limits
    const canCreate = await this.tierEnforcer.canCreateProject(userId, plan);
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason);
    }

    // Validate scope
    const scopeValidation = this.tierEnforcer.validateProjectScope(scope, plan);
    if (!scopeValidation.valid) {
      throw new Error(scopeValidation.reason);
    }

    // Create project
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const project: Project = {
      id: projectId,
      user_id: userId,
      name,
      target,
      scope,
      status: 'active',
      plan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.projects.set(projectId, project);
    console.log(`Created project ${projectId} for user ${userId}`);
    
    return project;
  }

  async getProject(projectId: string): Promise<Project | null> {
    const project = this.projects.get(projectId);
    return project || null;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const userIdNum = parseInt(userId);
    return Array.from(this.projects.values()).filter(
      project => project.user_id === userIdNum
    );
  }

  async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<Project | null> {
    const existingProject = this.projects.get(projectId);
    if (!existingProject) {
      return null;
    }

    const updatedProject: Project = {
      ...existingProject,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.projects.set(projectId, updatedProject);
    return updatedProject;
  }

  async updateProjectScope(
    projectId: string,
    scope: string[],
    plan: 'free' | 'paid'
  ): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Validate new scope
    const scopeValidation = this.tierEnforcer.validateProjectScope(scope, plan);
    if (!scopeValidation.valid) {
      throw new Error(scopeValidation.reason);
    }

    // Update project
    project.scope = scope;
    project.updated_at = new Date().toISOString();
    
    this.projects.set(projectId, project);
    console.log(`Updated scope for project ${projectId}`);
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const deleted = this.projects.delete(projectId);
    if (deleted) {
      console.log(`Deleted project ${projectId}`);
    }
    return deleted;
  }

  async pauseProject(projectId: string): Promise<Project | null> {
    return this.updateProject(projectId, { status: 'paused' });
  }

  async resumeProject(projectId: string): Promise<Project | null> {
    return this.updateProject(projectId, { status: 'active' });
  }

  async completeProject(projectId: string): Promise<Project | null> {
    return this.updateProject(projectId, { status: 'completed' });
  }

  // Project validation methods
  async validateProjectAccess(
    projectId: string,
    userId: number
  ): Promise<{ valid: boolean; reason?: string }> {
    const project = this.projects.get(projectId);
    
    if (!project) {
      return { valid: false, reason: 'Project not found' };
    }

    if (project.user_id !== userId) {
      return { valid: false, reason: 'Access denied - project belongs to different user' };
    }

    return { valid: true };
  }

  async getProjectStats(projectId: string): Promise<{
    scope_entries: number;
    status: string;
    plan: string;
    created_days_ago: number;
    last_updated_hours_ago: number;
  } | null> {
    const project = this.projects.get(projectId);
    if (!project) {
      return null;
    }

    const createdDate = new Date(project.created_at);
    const updatedDate = new Date(project.updated_at);
    const now = new Date();

    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const hoursDiff = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60));

    return {
      scope_entries: project.scope.length,
      status: project.status,
      plan: project.plan,
      created_days_ago: daysDiff,
      last_updated_hours_ago: hoursDiff
    };
  }

  async getUserProjectStats(userId: number): Promise<{
    total_projects: number;
    active_projects: number;
    paused_projects: number;
    completed_projects: number;
    free_projects: number;
    paid_projects: number;
  }> {
    const userProjects = Array.from(this.projects.values()).filter(
      project => project.user_id === userId
    );

    return {
      total_projects: userProjects.length,
      active_projects: userProjects.filter(p => p.status === 'active').length,
      paused_projects: userProjects.filter(p => p.status === 'paused').length,
      completed_projects: userProjects.filter(p => p.status === 'completed').length,
      free_projects: userProjects.filter(p => p.plan === 'free').length,
      paid_projects: userProjects.filter(p => p.plan === 'paid').length
    };
  }

  // Scope management utilities
  async addScopeEntry(
    projectId: string,
    entry: string,
    userPlan: 'free' | 'paid'
  ): Promise<{ success: boolean; reason?: string }> {
    const project = this.projects.get(projectId);
    if (!project) {
      return { success: false, reason: 'Project not found' };
    }

    if (project.scope.includes(entry)) {
      return { success: false, reason: 'Entry already exists in scope' };
    }

    const newScope = [...project.scope, entry];
    const validation = this.tierEnforcer.validateProjectScope(newScope, userPlan);
    
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    project.scope = newScope;
    project.updated_at = new Date().toISOString();
    this.projects.set(projectId, project);

    return { success: true };
  }

  async removeScopeEntry(
    projectId: string,
    entry: string
  ): Promise<{ success: boolean; reason?: string }> {
    const project = this.projects.get(projectId);
    if (!project) {
      return { success: false, reason: 'Project not found' };
    }

    const entryIndex = project.scope.indexOf(entry);
    if (entryIndex === -1) {
      return { success: false, reason: 'Entry not found in scope' };
    }

    project.scope.splice(entryIndex, 1);
    project.updated_at = new Date().toISOString();
    this.projects.set(projectId, project);

    return { success: true };
  }

  // Get tier enforcer for external use
  getTierEnforcer(): TierEnforcer {
    return this.tierEnforcer;
  }

  // Cleanup old projects (for maintenance)
  async cleanupOldProjects(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    for (const [projectId, project] of this.projects.entries()) {
      const projectDate = new Date(project.created_at);
      if (projectDate < cutoffDate && project.status === 'completed') {
        this.projects.delete(projectId);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} old projects`);
    return deletedCount;
  }
}