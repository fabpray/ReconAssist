import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  plan: text("plan").notNull().default("free"), // free | paid
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  target: text("target").notNull(),
  scope: jsonb("scope").$type<string[]>().notNull(),
  status: text("status").notNull().default("active"), // active | paused | completed
  plan: text("plan").notNull().default("free"), // free | paid
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Project tools configuration
export const project_tools = pgTable("project_tools", {
  id: text("id").primaryKey(),
  project_id: text("project_id").notNull().references(() => projects.id),
  tool_name: text("tool_name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config").$type<Record<string, any>>().notNull().default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Project headers
export const project_headers = pgTable("project_headers", {
  id: text("id").primaryKey(),
  project_id: text("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  value: text("value").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Reconnaissance runs
export const runs = pgTable("runs", {
  id: text("id").primaryKey(),
  project_id: text("project_id").notNull().references(() => projects.id),
  tool: text("tool").notNull(),
  target: text("target").notNull(),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  output: jsonb("output").$type<any>(),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  completed_at: timestamp("completed_at"),
});

// Findings from reconnaissance
export const findings = pgTable("findings", {
  id: text("id").primaryKey(),
  run_id: text("run_id").notNull().references(() => runs.id),
  project_id: text("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // low | medium | high | critical
  type: text("type").notNull(), // subdomain | endpoint | vulnerability | secret | etc
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Messages (chat history, LLM decisions, tool outputs)
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  project_id: text("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(), // user | llm_decision | tool_output | override | system
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User feedback on actions/results
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  project_id: text("project_id").notNull().references(() => projects.id),
  target_id: text("target_id").notNull(), // message_id, run_id, etc
  target_type: text("target_type").notNull(), // message | run | finding
  feedback_type: text("feedback_type").notNull(), // thumb_up | thumb_down | override | correction
  content: text("content"), // for overrides and corrections
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// User overrides and constraints
export const overrides = pgTable("overrides", {
  id: text("id").primaryKey(),
  project_id: text("project_id").notNull().references(() => projects.id),
  content: text("content").notNull(),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// API keys storage (encrypted)
export const api_keys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  service: text("service").notNull(), // shodan | securitytrails | censys | etc
  encrypted_key: text("encrypted_key").notNull(),
  is_valid: boolean("is_valid").notNull().default(true),
  last_validated: timestamp("last_validated"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Cache for API results and tool outputs
export const cache = pgTable("cache", {
  id: text("id").primaryKey(),
  cache_key: text("cache_key").notNull().unique(),
  data: jsonb("data").$type<any>().notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Embeddings for semantic search (future enhancement)
export const embeddings = pgTable("embeddings", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  embedding: text("embedding"), // stored as JSON string of vector
  metadata: jsonb("metadata").$type<Record<string, any>>().notNull().default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  api_keys: many(api_keys),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.user_id], references: [users.id] }),
  tools: many(project_tools),
  headers: many(project_headers),
  runs: many(runs),
  findings: many(findings),
  messages: many(messages),
  feedback: many(feedback),
  overrides: many(overrides),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  project: one(projects, { fields: [runs.project_id], references: [projects.id] }),
  findings: many(findings),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  run: one(runs, { fields: [findings.run_id], references: [runs.id] }),
  project: one(projects, { fields: [findings.project_id], references: [projects.id] }),
}));

// Schema validators
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  plan: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertRunSchema = createInsertSchema(runs).omit({
  id: true,
  created_at: true,
  completed_at: true,
});

export const insertFindingSchema = createInsertSchema(findings).omit({
  id: true,
  created_at: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  created_at: true,
});

export const insertOverrideSchema = createInsertSchema(overrides).omit({
  id: true,
  created_at: true,
});

export const insertApiKeySchema = createInsertSchema(api_keys).omit({
  id: true,
  created_at: true,
  last_validated: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectTool = typeof project_tools.$inferSelect;
export type ProjectHeader = typeof project_headers.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Override = typeof overrides.$inferSelect;
export type InsertOverride = z.infer<typeof insertOverrideSchema>;
export type ApiKey = typeof api_keys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
