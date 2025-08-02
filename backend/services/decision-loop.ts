import { LLMClient, type LLMDecision, type ActionCard } from './llm-client';

export interface DecisionResult {
  id: string;
  actions: ActionCard[];
  reasoning: string;
  confidence: number;
  auto_execute: boolean;
  requires_approval: boolean;
  message_id: string;
  timestamp: string;
}

export class DecisionLoop {
  private llmClient: LLMClient;
  private decisionHistory: Map<string, DecisionResult[]> = new Map();

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  async processUserInput(
    projectId: string, 
    userMessage: string, 
    userId: string
  ): Promise<DecisionResult> {
    
    // Get LLM decision
    const llmDecision = await this.llmClient.getDecision(userMessage, userId);
    
    // Create decision result
    const decisionResult: DecisionResult = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actions: llmDecision.actions,
      reasoning: llmDecision.reasoning,
      confidence: llmDecision.confidence,
      auto_execute: this.shouldAutoExecute(llmDecision),
      requires_approval: !this.shouldAutoExecute(llmDecision),
      message_id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // Store decision in history
    if (!this.decisionHistory.has(projectId)) {
      this.decisionHistory.set(projectId, []);
    }
    this.decisionHistory.get(projectId)!.push(decisionResult);

    // Keep only last 10 decisions per project
    const history = this.decisionHistory.get(projectId)!;
    if (history.length > 10) {
      this.decisionHistory.set(projectId, history.slice(-10));
    }

    return decisionResult;
  }

  private shouldAutoExecute(decision: LLMDecision): boolean {
    // Auto-execute only if:
    // 1. High confidence (>= 0.8)
    // 2. No clarification needed
    // 3. Actions are low-risk
    
    if (decision.confidence < 0.8 || decision.needs_clarification) {
      return false;
    }

    // Check if all actions are safe for auto-execution
    const safeTools = ['subfinder', 'httpx', 'waybackurls', 'gau', 'dnsx'];
    const allSafe = decision.actions.every(action => 
      safeTools.includes(action.tool) && action.confidence >= 0.7
    );

    return allSafe;
  }

  async approveDecision(
    projectId: string, 
    decisionId: string, 
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    
    const history = this.decisionHistory.get(projectId);
    if (!history) {
      return { success: false, message: 'Project not found' };
    }

    const decision = history.find(d => d.id === decisionId);
    if (!decision) {
      return { success: false, message: 'Decision not found' };
    }

    if (!decision.requires_approval) {
      return { success: false, message: 'Decision does not require approval' };
    }

    // Mark as approved and ready for execution
    decision.requires_approval = false;
    decision.auto_execute = true;

    return { 
      success: true, 
      message: `Decision ${decisionId} approved for execution` 
    };
  }

  async rejectDecision(
    projectId: string, 
    decisionId: string, 
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    
    const history = this.decisionHistory.get(projectId);
    if (!history) {
      return { success: false, message: 'Project not found' };
    }

    const decisionIndex = history.findIndex(d => d.id === decisionId);
    if (decisionIndex === -1) {
      return { success: false, message: 'Decision not found' };
    }

    // Remove rejected decision from history
    history.splice(decisionIndex, 1);

    return { 
      success: true, 
      message: `Decision ${decisionId} rejected${reason ? ': ' + reason : ''}` 
    };
  }

  getDecisionHistory(projectId: string): DecisionResult[] {
    return this.decisionHistory.get(projectId) || [];
  }

  getPendingDecisions(projectId: string): DecisionResult[] {
    const history = this.decisionHistory.get(projectId) || [];
    return history.filter(d => d.requires_approval);
  }

  getAutoExecutableDecisions(projectId: string): DecisionResult[] {
    const history = this.decisionHistory.get(projectId) || [];
    return history.filter(d => d.auto_execute && !d.requires_approval);
  }

  clearDecisionHistory(projectId: string): void {
    this.decisionHistory.delete(projectId);
  }

  // For debugging and transparency
  getDecisionStats(projectId: string): {
    total_decisions: number;
    auto_executed: number;
    pending_approval: number;
    average_confidence: number;
  } {
    const history = this.decisionHistory.get(projectId) || [];
    
    const autoExecuted = history.filter(d => d.auto_execute && !d.requires_approval).length;
    const pendingApproval = history.filter(d => d.requires_approval).length;
    const avgConfidence = history.length > 0 
      ? history.reduce((sum, d) => sum + d.confidence, 0) / history.length 
      : 0;

    return {
      total_decisions: history.length,
      auto_executed: autoExecuted,
      pending_approval: pendingApproval,
      average_confidence: Math.round(avgConfidence * 100) / 100
    };
  }
}