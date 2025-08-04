import { users, type User, type InsertUser, projects, type Project, type InsertProject } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<string, Project>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      plan: insertUser.plan || 'free',
      created_at: now,
      updated_at: now
    };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.user_id === userId
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const project: Project = {
      ...insertProject,
      id,
      plan: insertProject.plan || 'free',
      status: insertProject.status || 'active',
      created_at: now,
      updated_at: now
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) {
      return undefined;
    }

    const updatedProject: Project = {
      ...existingProject,
      ...updates,
      updated_at: new Date()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    const result = await db.select().from(projects).where(eq(projects.user_id, userId));
    return result;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectWithId = { ...insertProject, id };
    const result = await db.insert(projects).values(projectWithId).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
