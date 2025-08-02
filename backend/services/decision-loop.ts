import { LLMDecision, ContextItem, ActionCard, Message, Finding } from '../../shared/types';
import { LLMClient } from './llm-client';

export class DecisionLoop {
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  async processUserInput(
    projectId: string,
    userInput: string,
    userId: string
  ): Promise<LLMDecision> {
    // Retrieve relevant context
    const context = await this.retrieveContext(projectId, userInput);
    
    // Get project scope and constraints
    const project = await this.getProject(projectId);
    const overrides = await this.getActiveOverrides(projectId);
    
    // Build prompt template
    const prompt = this.buildPrompt(project, context, overrides, userInput);
    
    // Get LLM decision
    const llmResponse = await this.llmClient.getDecision(prompt, userId);
    
    // Parse and validate response
    const decision = this.parseDecision(llmResponse);
    
    // Store decision message
    await this.storeDecisionMessage(projectId, userInput, decision);
    
    return decision;
  }

  private async retrieveContext(projectId: string, userInput: string): Promise<ContextItem[]> {
    // For now, use heuristic retrieval (recent + high severity + overrides)
    // TODO: Replace with embedding-based semantic retrieval
    
    const context: ContextItem[] = [];
    
    // Get recent messages
    const recentMessages = await this.getRecentMessages(projectId, 10);
    context.push(...recentMessages.map(msg => ({
      type: 'message' as const,
      content: msg.content,
      relevance_score: this.calculateRecencyScore(msg.created_at),
      timestamp: msg.created_at
    })));
    
    // Get high-severity findings
    const criticalFindings = await this.getHighSeverityFindings(projectId);
    context.push(...criticalFindings.map(finding => ({
      type: 'finding' as const,
      content: `${finding.title}: ${finding.description}`,
      relevance_score: this.calculateSeverityScore(finding.severity),
      timestamp: finding.created_at
    })));
    
    // Get active overrides
    const overrides = await this.getActiveOverrides(projectId);
    context.push(...overrides.map(override => ({
      type: 'override' as const,
      content: override.content,
      relevance_score: 1.0, // Overrides always have highest relevance
      timestamp: override.created_at
    })));
    
    // Sort by relevance and return top N
    return context
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 20);
  }

  private buildPrompt(
    project: any,
    context: ContextItem[],
    overrides: any[],
    userInput: string
  ): string {
    const systemInstructions = `You are ReconAI, an expert security reconnaissance assistant. Your task is to analyze the user's request and suggest specific reconnaissance actions.

Project Scope: ${project.scope.join(', ')}
Target: ${project.target}
Plan: ${project.plan}

CONSTRAINTS:
${overrides.map(o => `- ${o.content}`).join('\n')}

CONTEXT:
${context.map(c => `[${c.type}] ${c.content}`).join('\n')}

INSTRUCTIONS:
1. Analyze the user's request in the context of the reconnaissance project
2. Suggest 1-3 specific actions using available tools
3. For each action, provide: tool name, target, reasoning, confidence (0-1), and whether it's inferred
4. If the request is ambiguous, ask for clarification instead of guessing
5. Respect the project scope and any user constraints

Available tools: ${project.plan === 'free' ? 'subfinder, httpx, waybackurls (throttled)' : 'subfinder, httpx, waybackurls, gau, paramspider, arjun, kiterunner, trufflehog, nmap'}

Respond in JSON format:
{
  "actions": [
    {
      "tool": "tool_name",
      "target": "specific_target",
      "reason": "why this action is suggested",
      "confidence": 0.8,
      "inferred": false
    }
  ],
  "reasoning": "overall reasoning for the suggested actions",
  "confidence": 0.8,
  "clarification": "question if unclear (optional)"
}`;

    return `${systemInstructions}\n\nUser Request: ${userInput}`;
  }

  private parseDecision(llmResponse: string): LLMDecision {
    try {
      const parsed = JSON.parse(llmResponse);
      
      const actions: ActionCard[] = parsed.actions.map((action: any, index: number) => ({
        id: `action_${Date.now()}_${index}`,
        tool: action.tool,
        target: action.target,
        reason: action.reason,
        confidence: action.confidence,
        inferred: action.inferred || false,
        status: 'suggested' as const
      }));

      return {
        actions,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
        clarification: parsed.clarification
      };
    } catch (error) {
      // Fallback for malformed responses
      return {
        actions: [],
        reasoning: "Failed to parse LLM response",
        confidence: 0,
        clarification: "I had trouble understanding the request. Could you please rephrase?"
      };
    }
  }

  // Stub implementations - replace with actual database queries
  private async getProject(projectId: string) {
    // TODO: Implement actual database query
    return {
      id: projectId,
      target: 'example.com',
      scope: ['*.example.com', 'example.com'],
      plan: 'free'
    };
  }

  private async getRecentMessages(projectId: string, limit: number): Promise<Message[]> {
    // TODO: Implement actual database query
    return [];
  }

  private async getHighSeverityFindings(projectId: string): Promise<Finding[]> {
    // TODO: Implement actual database query
    return [];
  }

  private async getActiveOverrides(projectId: string): Promise<any[]> {
    // TODO: Implement actual database query
    return [];
  }

  private async storeDecisionMessage(projectId: string, userInput: string, decision: LLMDecision) {
    // TODO: Implement actual database storage
    console.log('Storing decision message:', { projectId, userInput, decision });
  }

  private calculateRecencyScore(timestamp: string): number {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const ageHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    return Math.max(0, 1 - (ageHours / 24)); // Decay over 24 hours
  }

  private calculateSeverityScore(severity: string): number {
    const scores = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    return scores[severity as keyof typeof scores] || 0.2;
  }
}