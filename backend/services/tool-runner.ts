import { spawn } from 'child_process';
import { Run, Finding } from '../../shared/types';

export interface ToolResult {
  success: boolean;
  output: any;
  metadata: {
    origin: 'real' | 'cached' | 'simulated';
    cache_hit?: boolean;
    simulation_reason?: string;
    key_used?: string;
    execution_time_ms: number;
  };
  findings: Finding[];
}

export interface ToolConfig {
  name: string;
  tier: 'free' | 'paid';
  requires_key: boolean;
  rate_limited: boolean;
  installed: boolean;
  category: 'subdomain' | 'endpoint' | 'vulnerability' | 'secret' | 'port' | 'dns';
}

export class ToolRunner {
  private tools: Map<string, ToolConfig> = new Map();
  private cache: Map<string, { data: any; expires: Date }> = new Map();

  constructor() {
    this.initializeTools();
  }

  private initializeTools(): void {
    // Free tier tools (installed on Replit)
    this.tools.set('subfinder', {
      name: 'subfinder',
      tier: 'free',
      requires_key: false,
      rate_limited: false,
      installed: true,
      category: 'subdomain'
    });

    this.tools.set('httpx', {
      name: 'httpx',
      tier: 'free', 
      requires_key: false,
      rate_limited: false,
      installed: true,
      category: 'endpoint'
    });

    this.tools.set('waybackurls', {
      name: 'waybackurls',
      tier: 'free',
      requires_key: false,
      rate_limited: true,
      installed: true,
      category: 'endpoint'
    });

    this.tools.set('gau', {
      name: 'gau',
      tier: 'free',
      requires_key: false,
      rate_limited: true,
      installed: true,
      category: 'endpoint'
    });

    this.tools.set('arjun', {
      name: 'arjun',
      tier: 'free',
      requires_key: false,
      rate_limited: false,
      installed: true,
      category: 'vulnerability'
    });

    this.tools.set('trufflehog', {
      name: 'trufflehog',
      tier: 'free',
      requires_key: false,
      rate_limited: false,
      installed: true,
      category: 'secret'
    });

    this.tools.set('dnsx', {
      name: 'dnsx',
      tier: 'free',
      requires_key: false,
      rate_limited: false,
      installed: true,
      category: 'dns'
    });

    // Mocked tools (initially)
    this.tools.set('nmap', {
      name: 'nmap',
      tier: 'free',
      requires_key: false,
      rate_limited: false,
      installed: false,
      category: 'port'
    });

    this.tools.set('masscan', {
      name: 'masscan',
      tier: 'paid',
      requires_key: false,
      rate_limited: false,
      installed: false,
      category: 'port'
    });

    this.tools.set('amass', {
      name: 'amass',
      tier: 'paid',
      requires_key: false,
      rate_limited: false,
      installed: false,
      category: 'subdomain'
    });

    // Paid API tools
    this.tools.set('shodan', {
      name: 'shodan',
      tier: 'paid',
      requires_key: true,
      rate_limited: true,
      installed: false,
      category: 'endpoint'
    });

    this.tools.set('securitytrails', {
      name: 'securitytrails',
      tier: 'paid',
      requires_key: true,
      rate_limited: true,
      installed: false,
      category: 'subdomain'
    });

    this.tools.set('censys', {
      name: 'censys',
      tier: 'paid',
      requires_key: true,
      rate_limited: true,
      installed: false,
      category: 'endpoint'
    });
  }

  async executeTool(
    tool: string,
    target: string,
    projectId: string,
    userPlan: 'free' | 'paid',
    apiKeys: Record<string, string> = {},
    headers: Record<string, string> = {}
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const toolConfig = this.tools.get(tool);
    
    if (!toolConfig) {
      throw new Error(`Unknown tool: ${tool}`);
    }

    // Check tier access
    if (toolConfig.tier === 'paid' && userPlan === 'free' && !apiKeys[tool]) {
      throw new Error(`Tool ${tool} requires paid plan or user-provided API key`);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(tool, target, headers);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > new Date()) {
      return {
        success: true,
        output: cached.data,
        metadata: {
          origin: 'cached',
          cache_hit: true,
          execution_time_ms: Date.now() - startTime
        },
        findings: this.parseFindings(cached.data, tool, target, projectId)
      };
    }

    try {
      let result: any;
      
      if (toolConfig.installed) {
        result = await this.executeInstalledTool(tool, target, headers);
      } else if (toolConfig.requires_key && apiKeys[tool]) {
        result = await this.executeApiTool(tool, target, apiKeys[tool], headers);
      } else {
        result = await this.simulateTool(tool, target);
      }

      // Cache the result
      this.cacheResult(cacheKey, result, toolConfig.rate_limited ? 300 : 60); // 5min for rate limited, 1min for others

      const findings = this.parseFindings(result, tool, target, projectId);

      return {
        success: true,
        output: result,
        metadata: {
          origin: toolConfig.installed ? 'real' : 'simulated',
          key_used: apiKeys[tool] ? 'user' : undefined,
          execution_time_ms: Date.now() - startTime
        },
        findings
      };

    } catch (error) {
      // On failure, try simulation
      const simulatedResult = await this.simulateTool(tool, target);
      const findings = this.parseFindings(simulatedResult, tool, target, projectId);

      return {
        success: true,
        output: simulatedResult,
        metadata: {
          origin: 'simulated',
          simulation_reason: `Tool execution failed: ${error.message}`,
          execution_time_ms: Date.now() - startTime
        },
        findings
      };
    }
  }

  private async executeInstalledTool(tool: string, target: string, headers: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
      let command: string;
      let args: string[];

      switch (tool) {
        case 'subfinder':
          command = 'subfinder';
          args = ['-d', target, '-silent', '-json'];
          break;
        case 'httpx':
          command = 'httpx';
          args = ['-l', '-', '-json', '-silent', '-follow-redirects'];
          break;
        case 'waybackurls':
          command = 'waybackurls';
          args = [target];
          break;
        case 'gau':
          command = 'gau';
          args = [target, '--blacklist', 'png,jpg,gif,css,js'];
          break;
        case 'trufflehog':
          command = 'trufflehog';
          args = ['git', `https://github.com/${target}`, '--json'];
          break;
        case 'dnsx':
          command = 'dnsx';
          args = ['-d', target, '-json', '-silent'];
          break;
        default:
          return reject(new Error(`No execution logic for tool: ${tool}`));
      }

      const process = spawn(command, args, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000 // 1 minute timeout
      });

      let stdout = '';
      let stderr = '';

      if (tool === 'httpx') {
        // For httpx, pipe the target as input
        process.stdin.write(target + '\n');
        process.stdin.end();
      }

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(this.parseToolOutput(tool, stdout));
        } else {
          reject(new Error(`Tool ${tool} exited with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async executeApiTool(tool: string, target: string, apiKey: string, headers: Record<string, string>): Promise<any> {
    // Placeholder for API tool implementations
    // TODO: Implement actual API calls for Shodan, SecurityTrails, Censys, etc.
    
    switch (tool) {
      case 'shodan':
        return this.mockShodanSearch(target);
      case 'securitytrails':
        return this.mockSecurityTrailsSubdomains(target);
      case 'censys':
        return this.mockCensysSearch(target);
      default:
        throw new Error(`API implementation not available for ${tool}`);
    }
  }

  private async simulateTool(tool: string, target: string): Promise<any> {
    // Generate realistic mock data based on tool type
    switch (tool) {
      case 'subfinder':
        return this.mockSubfinderOutput(target);
      case 'httpx':
        return this.mockHttpxOutput(target);
      case 'nmap':
        return this.mockNmapOutput(target);
      case 'waybackurls':
        return this.mockWaybackOutput(target);
      case 'gau':
        return this.mockGauOutput(target);
      default:
        return { simulated: true, target, message: `Simulated output for ${tool}` };
    }
  }

  private parseToolOutput(tool: string, output: string): any {
    try {
      switch (tool) {
        case 'subfinder':
        case 'httpx':
        case 'dnsx':
          // These tools output JSON lines
          return output.split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return { raw: line };
              }
            });
        case 'waybackurls':
        case 'gau':
          // These output plain URLs
          return output.split('\n')
            .filter(line => line.trim())
            .map(url => ({ url: url.trim() }));
        case 'trufflehog':
          // TruffleHog outputs JSON
          return output.split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch {
                return { raw: line };
              }
            });
        default:
          return { raw: output };
      }
    } catch (error) {
      return { raw: output, parse_error: error.message };
    }
  }

  private parseFindings(toolOutput: any, tool: string, target: string, projectId: string): Finding[] {
    const findings: Finding[] = [];
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!Array.isArray(toolOutput)) {
      return findings;
    }

    toolOutput.forEach((item, index) => {
      let finding: Partial<Finding> = {
        id: `finding_${Date.now()}_${index}`,
        run_id: runId,
        project_id: projectId,
        severity: 'low',
        type: this.tools.get(tool)?.category || 'unknown',
        metadata: item,
        created_at: new Date().toISOString()
      };

      switch (tool) {
        case 'subfinder':
          if (item.host) {
            finding.title = `Subdomain discovered: ${item.host}`;
            finding.description = `Found subdomain ${item.host} for target ${target}`;
            finding.severity = 'low';
          }
          break;
        case 'httpx':
          if (item.url) {
            finding.title = `Active endpoint: ${item.url}`;
            finding.description = `HTTP service active on ${item.url} (${item.status_code})`;
            finding.severity = item.status_code >= 200 && item.status_code < 300 ? 'low' : 'medium';
          }
          break;
        case 'trufflehog':
          if (item.Raw) {
            finding.title = `Potential secret found`;
            finding.description = `TruffleHog detected potential secret: ${item.DetectorName}`;
            finding.severity = 'high';
          }
          break;
        default:
          finding.title = `${tool} result`;
          finding.description = `Result from ${tool} scan of ${target}`;
      }

      if (finding.title && finding.description) {
        findings.push(finding as Finding);
      }
    });

    return findings;
  }

  private generateCacheKey(tool: string, target: string, headers: Record<string, string>): string {
    return `${tool}:${target}:${JSON.stringify(headers)}`;
  }

  private cacheResult(key: string, data: any, ttlSeconds: number): void {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + ttlSeconds);
    this.cache.set(key, { data, expires });
  }

  // Mock data generators
  private mockSubfinderOutput(target: string): any[] {
    const subdomains = ['www', 'api', 'admin', 'mail', 'ftp', 'dev', 'staging'];
    return subdomains.map(sub => ({
      host: `${sub}.${target}`,
      source: 'simulated'
    }));
  }

  private mockHttpxOutput(target: string): any[] {
    return [
      { url: `https://${target}`, status_code: 200, title: 'Example Site' },
      { url: `https://www.${target}`, status_code: 200, title: 'Example Site' },
      { url: `https://api.${target}`, status_code: 404, title: 'Not Found' }
    ];
  }

  private mockNmapOutput(target: string): any {
    return {
      host: target,
      ports: [
        { port: 22, state: 'open', service: 'ssh' },
        { port: 80, state: 'open', service: 'http' },
        { port: 443, state: 'open', service: 'https' }
      ]
    };
  }

  private mockWaybackOutput(target: string): any[] {
    return [
      { url: `https://${target}/admin` },
      { url: `https://${target}/api/v1/users` },
      { url: `https://${target}/backup.sql` }
    ];
  }

  private mockGauOutput(target: string): any[] {
    return [
      { url: `https://${target}/api/v1/` },
      { url: `https://${target}/admin/login` },
      { url: `https://${target}/.env` }
    ];
  }

  private mockShodanSearch(target: string): any {
    return {
      matches: [
        { ip_str: '192.168.1.1', port: 80, product: 'nginx' },
        { ip_str: '192.168.1.1', port: 443, product: 'nginx' }
      ]
    };
  }

  private mockSecurityTrailsSubdomains(target: string): any {
    return {
      subdomains: ['www', 'api', 'mail', 'admin'],
      meta: { query_time: '2024-01-01' }
    };
  }

  private mockCensysSearch(target: string): any {
    return {
      results: [
        { ip: '192.168.1.1', services: [{ port: 80 }, { port: 443 }] }
      ]
    };
  }

  getAvailableTools(userPlan: 'free' | 'paid', userKeys: string[] = []): ToolConfig[] {
    return Array.from(this.tools.values()).filter(tool => {
      if (tool.tier === 'paid' && userPlan === 'free') {
        return userKeys.includes(tool.name);
      }
      return true;
    });
  }

  getToolConfig(toolName: string): ToolConfig | undefined {
    return this.tools.get(toolName);
  }
}