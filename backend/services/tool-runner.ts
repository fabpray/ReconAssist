import { ToolResult, ToolConfig, ActionCard } from '../../shared/types';

export class ToolRunner {
  private toolConfigs: Map<string, ToolConfig> = new Map();

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    const tools: ToolConfig[] = [
      {
        name: 'subfinder',
        enabled: true,
        free_tier: true,
        description: 'Subdomain enumeration tool',
        inputs: ['domain'],
        outputs: ['subdomains']
      },
      {
        name: 'httpx',
        enabled: true,
        free_tier: true,
        description: 'HTTP probe tool',
        inputs: ['urls', 'domains'],
        outputs: ['live_hosts', 'response_data']
      },
      {
        name: 'waybackurls',
        enabled: true,
        free_tier: true, // throttled
        description: 'Wayback Machine URL collector',
        inputs: ['domain'],
        outputs: ['historical_urls']
      },
      {
        name: 'gau',
        enabled: true,
        free_tier: false,
        description: 'URL collector from multiple sources',
        inputs: ['domain'],
        outputs: ['urls']
      },
      {
        name: 'paramspider',
        enabled: true,
        free_tier: false,
        description: 'Parameter discovery tool',
        inputs: ['urls'],
        outputs: ['parameters']
      },
      {
        name: 'arjun',
        enabled: true,
        free_tier: false,
        description: 'HTTP parameter discovery',
        inputs: ['urls'],
        outputs: ['parameters', 'vulnerabilities']
      },
      {
        name: 'kiterunner',
        enabled: true,
        free_tier: false,
        description: 'Content discovery tool',
        inputs: ['urls'],
        outputs: ['endpoints', 'directories']
      },
      {
        name: 'trufflehog',
        enabled: true,
        free_tier: false,
        description: 'Secret scanner',
        inputs: ['repositories', 'files'],
        outputs: ['secrets', 'credentials']
      },
      {
        name: 'nmap',
        enabled: true,
        free_tier: false,
        description: 'Network port scanner',
        inputs: ['hosts', 'ip_ranges'],
        outputs: ['open_ports', 'services']
      }
    ];

    tools.forEach(tool => {
      this.toolConfigs.set(tool.name, tool);
    });
  }

  async executeTool(
    toolName: string,
    target: string,
    projectId: string,
    userPlan: 'free' | 'paid',
    headers: Record<string, string> = {}
  ): Promise<ToolResult> {
    const toolConfig = this.toolConfigs.get(toolName);
    
    if (!toolConfig) {
      return {
        success: false,
        data: null,
        error: `Unknown tool: ${toolName}`,
        execution_time: 0
      };
    }

    // Check free tier restrictions
    if (userPlan === 'free' && !toolConfig.free_tier) {
      return {
        success: false,
        data: null,
        error: `Tool ${toolName} requires paid plan`,
        execution_time: 0
      };
    }

    const startTime = Date.now();

    try {
      const result = await this.runTool(toolName, target, headers);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        execution_time: executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        execution_time: executionTime
      };
    }
  }

  private async runTool(
    toolName: string,
    target: string,
    headers: Record<string, string>
  ): Promise<any> {
    // For now, return realistic mock data
    // TODO: Replace with actual tool execution (containerized)
    
    switch (toolName) {
      case 'subfinder':
        return this.mockSubfinder(target);
      case 'httpx':
        return this.mockHttpx(target);
      case 'waybackurls':
        return this.mockWaybackurls(target);
      case 'gau':
        return this.mockGau(target);
      case 'paramspider':
        return this.mockParamspider(target);
      case 'arjun':
        return this.mockArjun(target);
      case 'kiterunner':
        return this.mockKiterunner(target);
      case 'trufflehog':
        return this.mockTrufflehog(target);
      case 'nmap':
        return this.mockNmap(target);
      default:
        throw new Error(`Tool ${toolName} not implemented`);
    }
  }

  private async mockSubfinder(target: string) {
    // Simulate tool execution time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      subdomains: [
        `www.${target}`,
        `api.${target}`,
        `admin.${target}`,
        `mail.${target}`,
        `ftp.${target}`,
        `dev.${target}`,
        `staging.${target}`
      ],
      total_found: 7
    };
  }

  private async mockHttpx(target: string) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      live_hosts: [
        { url: `https://www.${target}`, status: 200, title: 'Homepage' },
        { url: `https://api.${target}`, status: 200, title: 'API' },
        { url: `https://admin.${target}`, status: 403, title: 'Admin Panel' },
        { url: `http://mail.${target}`, status: 200, title: 'Webmail' }
      ],
      total_checked: 7,
      live_count: 4
    };
  }

  private async mockWaybackurls(target: string) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      urls: [
        `https://www.${target}/admin`,
        `https://www.${target}/api/v1/users`,
        `https://www.${target}/backup.sql`,
        `https://www.${target}/config.php`,
        `https://api.${target}/internal/debug`
      ],
      total_found: 5
    };
  }

  private async mockGau(target: string) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      urls: [
        `https://www.${target}/api/v2/users`,
        `https://www.${target}/.env`,
        `https://www.${target}/upload.php`,
        `https://api.${target}/graphql`
      ],
      sources: ['AlienVault', 'URLScan', 'VirusTotal'],
      total_found: 4
    };
  }

  private async mockParamspider(target: string) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    return {
      parameters: [
        { url: `https://www.${target}/search`, param: 'q', type: 'GET' },
        { url: `https://www.${target}/user`, param: 'id', type: 'GET' },
        { url: `https://api.${target}/login`, param: 'username', type: 'POST' },
        { url: `https://api.${target}/login`, param: 'password', type: 'POST' }
      ],
      total_found: 4
    };
  }

  private async mockArjun(target: string) {
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    return {
      parameters: [
        { endpoint: `https://api.${target}/users`, param: 'admin', method: 'GET' },
        { endpoint: `https://www.${target}/search`, param: 'debug', method: 'GET' }
      ],
      vulnerabilities: [
        { type: 'Hidden Parameter', severity: 'medium', param: 'admin' }
      ],
      total_found: 2
    };
  }

  private async mockKiterunner(target: string) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      endpoints: [
        `https://api.${target}/v1/internal`,
        `https://www.${target}/.git/config`,
        `https://www.${target}/admin/dashboard`
      ],
      directories: [
        `https://www.${target}/backup/`,
        `https://api.${target}/docs/`
      ],
      total_found: 5
    };
  }

  private async mockTrufflehog(target: string) {
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    return {
      secrets: [
        { type: 'AWS Access Key', value: 'AKIA...', confidence: 'high' },
        { type: 'Private Key', value: '-----BEGIN PRIVATE KEY-----', confidence: 'medium' }
      ],
      total_found: 2
    };
  }

  private async mockNmap(target: string) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    return {
      open_ports: [
        { port: 22, service: 'SSH', version: 'OpenSSH 8.0' },
        { port: 80, service: 'HTTP', version: 'nginx 1.18' },
        { port: 443, service: 'HTTPS', version: 'nginx 1.18' },
        { port: 3306, service: 'MySQL', version: '8.0.25' }
      ],
      host_status: 'up',
      total_ports: 4
    };
  }

  getAvailableTools(userPlan: 'free' | 'paid'): ToolConfig[] {
    return Array.from(this.toolConfigs.values()).filter(tool => 
      userPlan === 'paid' || tool.free_tier
    );
  }

  getToolConfig(toolName: string): ToolConfig | undefined {
    return this.toolConfigs.get(toolName);
  }
}