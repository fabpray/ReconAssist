import { Project, User } from '../../shared/types';

export interface TierLimits {
  max_projects: number;
  max_scope_entries: number;
  max_headers: number;
  max_daily_runs: number;
  max_concurrent_runs: number;
  allowed_tools: string[];
  llm_model: 'basic' | 'advanced';
  export_formats: string[];
  priority_queue: boolean;
  api_key_fallback: boolean;
}

export class TierEnforcer {
  private limits: Record<'free' | 'paid', TierLimits>;

  constructor() {
    this.limits = {
      free: {
        max_projects: 2,
        max_scope_entries: 5,
        max_headers: 2,
        max_daily_runs: 10,
        max_concurrent_runs: 1,
        allowed_tools: [
          'subfinder', 'httpx', 'waybackurls', 'gau', 'arjun', 'trufflehog', 'dnsx'
        ],
        llm_model: 'basic',
        export_formats: [],
        priority_queue: false,
        api_key_fallback: false
      },
      paid: {
        max_projects: 50,
        max_scope_entries: 100,
        max_headers: 20,
        max_daily_runs: 1000,
        max_concurrent_runs: 5,
        allowed_tools: [
          'subfinder', 'httpx', 'waybackurls', 'gau', 'arjun', 'trufflehog', 'dnsx',
          'nmap', 'masscan', 'amass', 'shodan', 'securitytrails', 'censys', 
          'virustotal', 'builtwith', 'chaos', 'grayhatwarfare'
        ],
        llm_model: 'advanced',
        export_formats: ['pdf', 'json', 'csv', 'html'],
        priority_queue: true,
        api_key_fallback: true
      }
    };
  }

  /**
   * Get tier limits for a plan
   */
  getTierLimits(plan: 'free' | 'paid'): TierLimits {
    return this.limits[plan];
  }

  /**
   * Check if user can create a new project
   */
  async canCreateProject(userId: number, userPlan: 'free' | 'paid'): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const limits = this.limits[userPlan];
    
    // TODO: Get actual project count from database
    const currentProjectCount = 0; // await this.getProjectCount(userId);
    
    if (currentProjectCount >= limits.max_projects) {
      return {
        allowed: false,
        reason: `${userPlan} plan limited to ${limits.max_projects} projects. Upgrade for more projects.`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate project scope against tier limits
   */
  validateProjectScope(scope: string[], userPlan: 'free' | 'paid'): {
    valid: boolean;
    reason?: string;
  } {
    const limits = this.limits[userPlan];
    
    if (scope.length > limits.max_scope_entries) {
      return {
        valid: false,
        reason: `${userPlan} plan limited to ${limits.max_scope_entries} scope entries. Current: ${scope.length}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate project headers against tier limits
   */
  validateProjectHeaders(headerCount: number, userPlan: 'free' | 'paid'): {
    valid: boolean;
    reason?: string;
  } {
    const limits = this.limits[userPlan];
    
    if (headerCount > limits.max_headers) {
      return {
        valid: false,
        reason: `${userPlan} plan limited to ${limits.max_headers} custom headers. Current: ${headerCount}`
      };
    }

    return { valid: true };
  }

  /**
   * Check if tool is allowed for user's plan
   */
  isToolAllowed(tool: string, userPlan: 'free' | 'paid', hasUserApiKey: boolean = false): {
    allowed: boolean;
    reason?: string;
  } {
    const limits = this.limits[userPlan];
    
    // If user has their own API key, they can use any tool regardless of plan
    if (hasUserApiKey) {
      return { allowed: true };
    }
    
    if (!limits.allowed_tools.includes(tool)) {
      return {
        allowed: false,
        reason: `Tool '${tool}' requires ${userPlan === 'free' ? 'paid plan or user-provided API key' : 'API key'}`
      };
    }

    return { allowed: true };
  }

  /**
   * Check daily run limits
   */
  async canExecuteRun(userId: number, userPlan: 'free' | 'paid'): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
  }> {
    const limits = this.limits[userPlan];
    
    // TODO: Get actual daily run count from database
    const dailyRunCount = 0; // await this.getDailyRunCount(userId);
    
    if (dailyRunCount >= limits.max_daily_runs) {
      return {
        allowed: false,
        reason: `Daily limit of ${limits.max_daily_runs} runs reached. Resets at midnight UTC.`
      };
    }

    return { 
      allowed: true, 
      remaining: limits.max_daily_runs - dailyRunCount 
    };
  }

  /**
   * Check concurrent run limits
   */
  async canStartConcurrentRun(userId: number, userPlan: 'free' | 'paid'): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const limits = this.limits[userPlan];
    
    // TODO: Get actual concurrent run count from database
    const concurrentRunCount = 0; // await this.getConcurrentRunCount(userId);
    
    if (concurrentRunCount >= limits.max_concurrent_runs) {
      return {
        allowed: false,
        reason: `${userPlan} plan limited to ${limits.max_concurrent_runs} concurrent runs`
      };
    }

    return { allowed: true };
  }

  /**
   * Check export permissions
   */
  canExport(format: string, userPlan: 'free' | 'paid'): {
    allowed: boolean;
    reason?: string;
  } {
    const limits = this.limits[userPlan];
    
    if (!limits.export_formats.includes(format)) {
      return {
        allowed: false,
        reason: `Export format '${format}' requires paid plan`
      };
    }

    return { allowed: true };
  }

  /**
   * Get LLM model for plan
   */
  getLLMModel(userPlan: 'free' | 'paid'): 'basic' | 'advanced' {
    return this.limits[userPlan].llm_model;
  }

  /**
   * Check if user gets priority queue access
   */
  hasPriorityQueue(userPlan: 'free' | 'paid'): boolean {
    return this.limits[userPlan].priority_queue;
  }

  /**
   * Check if user gets API key fallback
   */
  hasApiKeyFallback(userPlan: 'free' | 'paid'): boolean {
    return this.limits[userPlan].api_key_fallback;
  }

  /**
   * Get comprehensive tier info for UI display
   */
  getTierInfo(userPlan: 'free' | 'paid'): {
    plan: string;
    limits: TierLimits;
    features: string[];
    restrictions: string[];
  } {
    const limits = this.limits[userPlan];
    
    const features = [
      `${limits.max_projects} projects`,
      `${limits.max_daily_runs} daily runs`,
      `${limits.allowed_tools.length} tools available`,
      `${limits.llm_model} AI model`
    ];

    if (limits.export_formats.length > 0) {
      features.push(`Export formats: ${limits.export_formats.join(', ')}`);
    }

    if (limits.priority_queue) {
      features.push('Priority queue access');
    }

    if (limits.api_key_fallback) {
      features.push('Developer API key fallback');
    }

    const restrictions = [];
    
    if (userPlan === 'free') {
      restrictions.push(`Limited to ${limits.max_scope_entries} scope entries`);
      restrictions.push(`Limited to ${limits.max_headers} custom headers`);
      restrictions.push(`Limited to ${limits.max_concurrent_runs} concurrent run`);
      restrictions.push('No export capabilities');
      restrictions.push('No priority queue access');
    }

    return {
      plan: userPlan,
      limits,
      features,
      restrictions
    };
  }

  /**
   * Validate a complete project configuration
   */
  validateProject(project: Partial<Project>, userPlan: 'free' | 'paid'): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check scope
    if (project.scope) {
      const scopeValidation = this.validateProjectScope(project.scope, userPlan);
      if (!scopeValidation.valid) {
        violations.push(scopeValidation.reason!);
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Get usage summary for a user
   */
  async getUsageSummary(userId: number, userPlan: 'free' | 'paid'): Promise<{
    plan: string;
    limits: TierLimits;
    current_usage: {
      projects: number;
      daily_runs: number;
      concurrent_runs: number;
    };
    usage_percentages: {
      projects: number;
      daily_runs: number;
    };
  }> {
    const limits = this.limits[userPlan];
    
    // TODO: Get actual usage from database
    const currentUsage = {
      projects: 0, // await this.getProjectCount(userId),
      daily_runs: 0, // await this.getDailyRunCount(userId),
      concurrent_runs: 0 // await this.getConcurrentRunCount(userId)
    };

    const usagePercentages = {
      projects: Math.round((currentUsage.projects / limits.max_projects) * 100),
      daily_runs: Math.round((currentUsage.daily_runs / limits.max_daily_runs) * 100)
    };

    return {
      plan: userPlan,
      limits,
      current_usage: currentUsage,
      usage_percentages: usagePercentages
    };
  }
}