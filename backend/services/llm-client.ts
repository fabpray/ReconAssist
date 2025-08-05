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
    // Generate realistic mock decisions based on prompt content - always with reconnaissance focus
    const lowerPrompt = prompt.toLowerCase();
    const actions: ActionCard[] = [];
    
    // Extract potential targets from the conversation
    const hasTarget = this.extractTarget(prompt) !== 'example.com';
    const reconKeywords = ['scan', 'recon', 'reconnaissance', 'enumerate', 'discover', 'find', 'search', 'probe', 'check', 'analyze', 'test', 'audit', 'investigate'];
    const hasReconIntent = reconKeywords.some(keyword => lowerPrompt.includes(keyword));
    
    // Check for domain/IP patterns that might indicate targets
    const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g;
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const hasImplicitTarget = domainPattern.test(prompt) || ipPattern.test(prompt);
    
    // Always suggest reconnaissance actions for clear targets or recon intent
    if (hasReconIntent || hasTarget || hasImplicitTarget) {
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

      // For clear recon intent or targets, suggest comprehensive initial recon
      if (actions.length === 0 && (hasReconIntent || hasTarget || hasImplicitTarget)) {
        actions.push({
          tool: 'subfinder',
          target: this.extractTarget(prompt),
          reason: 'Start with subdomain enumeration as the foundation of reconnaissance',
          confidence: 0.7,
          inferred: true
        });
      }
    }
    
    // For pure conversational messages without clear targets, provide guided responses
    const pureConversationalWords = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'yes', 'no'];
    const isGreeting = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].some(word => lowerPrompt.includes(word));
    const isThankYou = ['thanks', 'thank you'].some(word => lowerPrompt.includes(word));
    const isHelpRequest = ['help', 'what can you do', 'what', 'how'].some(phrase => lowerPrompt.includes(phrase));
    
    const isPureConversational = pureConversationalWords.some(word => lowerPrompt.includes(word)) && 
                                actions.length === 0 && 
                                !hasReconIntent && 
                                !hasTarget && 
                                !hasImplicitTarget;
    
    if (isPureConversational) {
      const reasoning = this.generateConversationalResponse(prompt);
      
      // Only suggest demo actions for help requests, not for thanks/greetings
      if (isHelpRequest) {
        actions.push({
          tool: 'subfinder',
          target: 'example.com',
          reason: 'Demonstrate subdomain discovery - replace with your target domain',
          confidence: 0.6,
          inferred: true
        });
      }
      
      return {
        actions: actions,
        reasoning: reasoning,
        confidence: 0.9,
        needs_clarification: actions.length === 0
      };
    }

    // Generate appropriate reasoning based on whether actions were suggested
    let reasoning: string;
    if (actions.length > 0) {
      reasoning = `I'll help you gather intelligence on your target. Based on your request, I recommend ${actions.length === 1 ? 'this reconnaissance action' : 'these reconnaissance actions'} to build a comprehensive security profile.`;
    } else {
      reasoning = this.generateConversationalResponse(prompt);
    }

    return {
      actions: actions.slice(0, 2), // Limit to 2 actions as per spec
      reasoning: reasoning,
      confidence: actions.length > 0 ? Math.max(...actions.map(a => a.confidence)) : 0.9,
      needs_clarification: actions.length === 0
    };
  }

  private generateConversationalResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hi') || lowerPrompt.includes('hello') || lowerPrompt.includes('hey')) {
      return "Hello! I'm your reconnaissance specialist. What target or domain would you like me to investigate today? I can discover subdomains, enumerate endpoints, scan for vulnerabilities, and gather intelligence.";
    }
    
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do')) {
      return "I specialize in reconnaissance and security testing. I can perform subdomain discovery, endpoint enumeration, vulnerability scanning, secret detection, and threat intelligence gathering. What's your target domain or IP range?";
    }
    
    if (lowerPrompt.includes('thanks') || lowerPrompt.includes('thank you')) {
      return "You're welcome! Ready to discover more intelligence? What other targets should we investigate, or would you like me to run additional scans on previous targets?";
    }
    
    if (lowerPrompt.includes('weather') || lowerPrompt.includes('news') || lowerPrompt.includes('time')) {
      return "I focus on cybersecurity reconnaissance rather than general information. However, I can help you investigate any domains, IP addresses, or systems for security intelligence. What would you like to scan?";
    }
    
    if (lowerPrompt.includes('how are you') || lowerPrompt.includes('whats up')) {
      return "I'm ready to conduct reconnaissance operations! My tools are loaded and waiting. What target should we investigate first - a domain, IP range, or specific system?";
    }
    
    // Generic conversational response that always pivots to recon
    return "I understand. As your reconnaissance specialist, I'm here to help gather intelligence on targets. What domain, IP address, or system would you like me to investigate?";
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