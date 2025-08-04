// LLM Client for decision making and planning
// This is a placeholder implementation - in production would integrate with OpenAI or similar

export interface LLMDecision {
  actions: ActionCard[];
  reasoning: string;
  confidence: number;
  needs_clarification: boolean;
  clarification_question?: string;
}

export interface ActionCard {
  tool: string;
  target: string;
  reason: string;
  confidence: number;
  inferred: boolean;
}

export class LLMClient {
  private apiKey: string | null;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
    this.model = 'tngtech/deepseek-r1t2-chimera:free';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async getDecision(prompt: string, userId: string): Promise<LLMDecision> {
    // For MVP, return mock decisions
    // TODO: Replace with actual OpenAI integration when API key is available
    
    if (!this.apiKey) {
      console.log('No OpenRouter API key available, returning mock decision');
      return this.generateMockDecision(prompt);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'ReconAssistant'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are ReconAI, an expert security reconnaissance assistant. Analyze user requests and return JSON with actions array containing tool recommendations. Each action should have: tool (string), target (string), reason (string), confidence (0-1), inferred (boolean). Also include reasoning (string), confidence (0-1), needs_clarification (boolean), and optional clarification_question (string).' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status, response.statusText);
        return this.generateMockDecision(prompt);
      }

      const data = await response.json();
      return this.parseApiResponse(data);
      
    } catch (error) {
      console.error('LLM API error:', error);
      return this.generateMockDecision(prompt);
    }
  }

  private parseApiResponse(data: any): LLMDecision {
    try {
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.log('No content in API response, using mock decision');
        return this.generateMockDecision('No content received');
      }

      // Try to parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        // If not JSON, try to extract structured data from text
        console.log('Response not in JSON format, using mock decision');
        return this.generateMockDecision(content);
      }

      return {
        actions: parsed.actions || [],
        reasoning: parsed.reasoning || 'AI analysis completed',
        confidence: parsed.confidence || 0.8,
        needs_clarification: parsed.needs_clarification || false,
        clarification_question: parsed.clarification_question
      };
    } catch (error) {
      console.error('Error parsing API response:', error);
      return this.generateMockDecision('Parse error');
    }
  }

  private generateMockDecision(prompt: string): LLMDecision {
    // Generate realistic mock decisions based on prompt content
    const lowerPrompt = prompt.toLowerCase();
    const actions: ActionCard[] = [];

    if (lowerPrompt.includes('subdomain') || lowerPrompt.includes('discover') || lowerPrompt.includes('enumerate')) {
      actions.push({
        tool: 'subfinder',
        target: this.extractTarget(prompt),
        reason: 'Discover subdomains to map the attack surface',
        confidence: 0.9,
        inferred: false
      });
    }

    if (lowerPrompt.includes('endpoint') || lowerPrompt.includes('url') || lowerPrompt.includes('directory')) {
      actions.push({
        tool: 'gau',
        target: this.extractTarget(prompt),
        reason: 'Gather URLs from web archives to find hidden endpoints',
        confidence: 0.8,
        inferred: true
      });
    }

    if (lowerPrompt.includes('alive') || lowerPrompt.includes('active') || lowerPrompt.includes('probe')) {
      actions.push({
        tool: 'httpx',
        target: this.extractTarget(prompt),
        reason: 'Probe discovered subdomains for active HTTP services',
        confidence: 0.85,
        inferred: false
      });
    }

    if (lowerPrompt.includes('secret') || lowerPrompt.includes('leak') || lowerPrompt.includes('credential')) {
      actions.push({
        tool: 'trufflehog',
        target: this.extractTarget(prompt),
        reason: 'Scan for leaked secrets and credentials',
        confidence: 0.75,
        inferred: true
      });
    }

    // If no specific actions identified, suggest basic reconnaissance
    if (actions.length === 0) {
      actions.push({
        tool: 'subfinder',
        target: this.extractTarget(prompt),
        reason: 'Start with subdomain enumeration as the foundation of reconnaissance',
        confidence: 0.7,
        inferred: true
      });
    }

    return {
      actions: actions.slice(0, 2), // Limit to 2 actions as per spec
      reasoning: `Based on your request, I recommend starting with ${actions.length === 1 ? 'this action' : 'these actions'} to gather initial intelligence about the target.`,
      confidence: actions.length > 0 ? Math.max(...actions.map(a => a.confidence)) : 0.5,
      needs_clarification: false
    };
  }

  private extractTarget(prompt: string): string {
    // Simple target extraction from prompt
    const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g;
    const matches = prompt.match(domainPattern);
    
    if (matches && matches.length > 0) {
      return matches[0].replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
    
    return 'example.com'; // Fallback target
  }

  private parseOpenAIResponse(data: any): LLMDecision {
    // TODO: Parse actual OpenAI response format
    try {
      const content = JSON.parse(data.choices[0].message.content);
      return {
        actions: content.actions || [],
        reasoning: content.reasoning || 'No reasoning provided',
        confidence: content.confidence || 0.5,
        needs_clarification: content.needs_clarification || false,
        clarification_question: content.clarification_question
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return this.generateMockDecision('fallback');
    }
  }

  async generateSummary(findings: any[], context: string): Promise<string> {
    // Generate summary of findings
    if (!this.apiKey) {
      return this.generateMockSummary(findings);
    }

    // TODO: Implement actual OpenAI summary generation
    return this.generateMockSummary(findings);
  }

  private generateMockSummary(findings: any[]): string {
    if (findings.length === 0) {
      return 'No significant findings discovered during reconnaissance.';
    }

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const totalCount = findings.length;

    let summary = `Reconnaissance completed with ${totalCount} findings discovered.`;
    
    if (criticalCount > 0) {
      summary += ` ${criticalCount} critical issues require immediate attention.`;
    }
    
    if (highCount > 0) {
      summary += ` ${highCount} high-severity issues should be investigated.`;
    }

    return summary;
  }

  isAvailable(): boolean {
    return this.apiKey !== null;
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }
}