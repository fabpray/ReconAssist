import { Finding, Project } from '../../shared/types.js';

export interface ThreatPrediction {
  id: string;
  project_id: string;
  threat_type: string;
  risk_score: number;
  confidence: number;
  predicted_attack_vectors: string[];
  recommended_actions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  impact: number;
  created_at: string;
}

export interface RiskAssessment {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  primary_threats: ThreatPrediction[];
  vulnerability_trends: {
    increasing: string[];
    decreasing: string[];
    stable: string[];
  };
  attack_surface_analysis: {
    exposed_services: number;
    critical_endpoints: number;
    weak_configurations: number;
    data_exposure_risk: number;
  };
  time_to_compromise_estimate: string;
  recommendations: string[];
}

export class ThreatIntelligenceEngine {
  private riskModels: Map<string, RiskModel> = new Map();

  constructor() {
    this.initializeRiskModels();
  }

  async analyzeFindings(projectId: string, findings: Finding[]): Promise<ThreatPrediction[]> {
    const predictions: ThreatPrediction[] = [];
    
    // Group findings by type for pattern analysis
    const findingGroups = this.groupFindingsByType(findings);
    
    for (const [type, groupedFindings] of findingGroups) {
      const prediction = await this.generateThreatPrediction(
        projectId,
        type,
        groupedFindings
      );
      
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Analyze cross-type patterns for advanced threats
    const advancedThreats = await this.analyzeAdvancedThreatPatterns(
      projectId,
      findings
    );
    
    predictions.push(...advancedThreats);

    return predictions.sort((a, b) => b.risk_score - a.risk_score);
  }

  async generateRiskAssessment(
    project: Project,
    findings: Finding[],
    predictions: ThreatPrediction[]
  ): Promise<RiskAssessment> {
    const overallRiskScore = this.calculateOverallRiskScore(predictions);
    const riskLevel = this.determineRiskLevel(overallRiskScore);
    
    const attackSurfaceAnalysis = this.analyzeAttackSurface(findings);
    const vulnerabilityTrends = await this.analyzeVulnerabilityTrends(project.id);
    const timeToCompromise = this.estimateTimeToCompromise(predictions, findings);
    
    const recommendations = this.generateRecommendations(
      predictions,
      findings,
      attackSurfaceAnalysis
    );

    return {
      overall_risk_score: overallRiskScore,
      risk_level: riskLevel,
      primary_threats: predictions.slice(0, 5),
      vulnerability_trends: vulnerabilityTrends,
      attack_surface_analysis: attackSurfaceAnalysis,
      time_to_compromise_estimate: timeToCompromise,
      recommendations
    };
  }

  private initializeRiskModels(): void {
    // Define risk scoring models for different threat types
    this.riskModels.set('exposed_admin_panel', {
      base_score: 75,
      factors: {
        no_authentication: 30,
        weak_credentials: 20,
        sensitive_data_access: 25,
        privilege_escalation: 15
      }
    });

    this.riskModels.set('sql_injection', {
      base_score: 85,
      factors: {
        data_exposure: 25,
        authentication_bypass: 20,
        remote_code_execution: 30,
        database_access: 20
      }
    });

    this.riskModels.set('exposed_backup_files', {
      base_score: 60,
      factors: {
        contains_credentials: 25,
        source_code_exposure: 20,
        database_dump: 30,
        configuration_files: 15
      }
    });

    this.riskModels.set('subdomain_takeover', {
      base_score: 70,
      factors: {
        dns_misconfiguration: 20,
        abandoned_service: 15,
        cookie_hijacking: 25,
        phishing_potential: 20
      }
    });

    this.riskModels.set('exposed_api_endpoints', {
      base_score: 55,
      factors: {
        no_authentication: 25,
        sensitive_data: 20,
        write_operations: 20,
        rate_limiting_missing: 10
      }
    });
  }

  private groupFindingsByType(findings: Finding[]): Map<string, Finding[]> {
    const groups = new Map<string, Finding[]>();
    
    for (const finding of findings) {
      const type = this.classifyFindingType(finding);
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(finding);
    }
    
    return groups;
  }

  private classifyFindingType(finding: Finding): string {
    const title = finding.title.toLowerCase();
    const description = finding.description.toLowerCase();
    
    if (title.includes('admin') && title.includes('panel')) {
      return 'exposed_admin_panel';
    }
    
    if (title.includes('sql') && title.includes('injection')) {
      return 'sql_injection';
    }
    
    if (title.includes('backup') || title.includes('.sql') || title.includes('.bak')) {
      return 'exposed_backup_files';
    }
    
    if (title.includes('subdomain') && title.includes('takeover')) {
      return 'subdomain_takeover';
    }
    
    if (title.includes('api') || title.includes('endpoint')) {
      return 'exposed_api_endpoints';
    }
    
    if (title.includes('secret') || title.includes('key') || title.includes('token')) {
      return 'exposed_secrets';
    }
    
    return 'generic_vulnerability';
  }

  private async generateThreatPrediction(
    projectId: string,
    threatType: string,
    findings: Finding[]
  ): Promise<ThreatPrediction | null> {
    const riskModel = this.riskModels.get(threatType);
    if (!riskModel) {
      return null;
    }

    const riskScore = this.calculateThreatRiskScore(riskModel, findings);
    const confidence = this.calculateConfidence(findings.length, threatType);
    
    const attackVectors = this.predictAttackVectors(threatType, findings);
    const recommendations = this.generateThreatRecommendations(threatType, findings);
    
    const severity = this.determineSeverity(riskScore);
    const likelihood = this.calculateLikelihood(threatType, findings);
    const impact = this.calculateImpact(threatType, findings);

    return {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      threat_type: threatType,
      risk_score: riskScore,
      confidence,
      predicted_attack_vectors: attackVectors,
      recommended_actions: recommendations,
      severity,
      likelihood,
      impact,
      created_at: new Date().toISOString()
    };
  }

  private calculateThreatRiskScore(riskModel: RiskModel, findings: Finding[]): number {
    let score = riskModel.base_score;
    
    // Analyze findings to determine applicable risk factors
    for (const finding of findings) {
      const applicableFactors = this.identifyRiskFactors(riskModel, finding);
      
      for (const factor of applicableFactors) {
        score += riskModel.factors[factor] || 0;
      }
    }
    
    // Apply severity multiplier
    const severityMultiplier = this.getSeverityMultiplier(findings);
    score *= severityMultiplier;
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private identifyRiskFactors(riskModel: RiskModel, finding: Finding): string[] {
    const factors: string[] = [];
    const description = finding.description.toLowerCase();
    const metadata = finding.metadata || {};
    
    // Check for specific risk indicators based on finding content
    if (description.includes('no authentication') || description.includes('unauthenticated')) {
      factors.push('no_authentication');
    }
    
    if (description.includes('sensitive data') || description.includes('personal information')) {
      factors.push('sensitive_data_access', 'data_exposure');
    }
    
    if (description.includes('admin') || description.includes('administrator')) {
      factors.push('privilege_escalation');
    }
    
    if (description.includes('database') || description.includes('sql')) {
      factors.push('database_access');
    }
    
    if (metadata.status_code === 200) {
      factors.push('accessible');
    }
    
    return factors;
  }

  private getSeverityMultiplier(findings: Finding[]): number {
    const severityCounts = findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (severityCounts.critical > 0) return 1.3;
    if (severityCounts.high > 0) return 1.2;
    if (severityCounts.medium > 0) return 1.1;
    return 1.0;
  }

  private calculateConfidence(findingCount: number, threatType: string): number {
    // Base confidence on number of findings and threat type reliability
    let confidence = Math.min(0.9, 0.3 + (findingCount * 0.15));
    
    // Adjust based on threat type predictability
    const typeReliability = {
      'exposed_admin_panel': 0.9,
      'sql_injection': 0.85,
      'exposed_backup_files': 0.95,
      'subdomain_takeover': 0.8,
      'exposed_api_endpoints': 0.75
    };
    
    confidence *= typeReliability[threatType as keyof typeof typeReliability] || 0.7;
    
    return Math.round(confidence * 100) / 100;
  }

  private predictAttackVectors(threatType: string, findings: Finding[]): string[] {
    const vectorMappings = {
      'exposed_admin_panel': [
        'Brute force authentication',
        'Default credential exploitation',
        'Session hijacking',
        'Privilege escalation'
      ],
      'sql_injection': [
        'Database enumeration',
        'Data exfiltration',
        'Authentication bypass',
        'Remote code execution'
      ],
      'exposed_backup_files': [
        'Credential harvesting',
        'Source code analysis',
        'Configuration exploitation',
        'Information disclosure'
      ],
      'subdomain_takeover': [
        'DNS hijacking',
        'Phishing campaigns',
        'Cookie theft',
        'Traffic interception'
      ],
      'exposed_api_endpoints': [
        'Data enumeration',
        'Unauthorized access',
        'Rate limiting bypass',
        'API abuse'
      ]
    };
    
    return vectorMappings[threatType as keyof typeof vectorMappings] || [
      'Reconnaissance',
      'Exploitation',
      'Privilege escalation'
    ];
  }

  private generateThreatRecommendations(threatType: string, findings: Finding[]): string[] {
    const recommendationMappings = {
      'exposed_admin_panel': [
        'Implement strong authentication mechanisms',
        'Add IP whitelisting for admin access',
        'Enable multi-factor authentication',
        'Monitor admin panel access logs'
      ],
      'sql_injection': [
        'Use parameterized queries',
        'Implement input validation',
        'Apply principle of least privilege',
        'Regular security code reviews'
      ],
      'exposed_backup_files': [
        'Remove sensitive files from web directories',
        'Implement proper file permissions',
        'Use secure backup storage',
        'Regular backup security audits'
      ],
      'subdomain_takeover': [
        'Audit DNS configurations',
        'Remove unused DNS records',
        'Implement DNS monitoring',
        'Use domain validation certificates'
      ],
      'exposed_api_endpoints': [
        'Implement API authentication',
        'Add rate limiting',
        'Use API versioning',
        'Regular API security testing'
      ]
    };
    
    return recommendationMappings[threatType as keyof typeof recommendationMappings] || [
      'Conduct security assessment',
      'Implement security controls',
      'Monitor for anomalies'
    ];
  }

  private async analyzeAdvancedThreatPatterns(
    projectId: string,
    findings: Finding[]
  ): Promise<ThreatPrediction[]> {
    const predictions: ThreatPrediction[] = [];
    
    // Look for attack chain patterns
    const chainPatterns = this.detectAttackChains(findings);
    
    for (const pattern of chainPatterns) {
      const prediction: ThreatPrediction = {
        id: `advanced_threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        threat_type: 'multi_stage_attack',
        risk_score: pattern.risk_score,
        confidence: pattern.confidence,
        predicted_attack_vectors: pattern.attack_vectors,
        recommended_actions: pattern.recommendations,
        severity: this.determineSeverity(pattern.risk_score),
        likelihood: pattern.likelihood,
        impact: pattern.impact,
        created_at: new Date().toISOString()
      };
      
      predictions.push(prediction);
    }
    
    return predictions;
  }

  private detectAttackChains(findings: Finding[]): any[] {
    const chains = [];
    
    // Example: Admin panel + backup files = high risk combo
    const hasAdminPanel = findings.some(f => 
      f.title.toLowerCase().includes('admin') && f.title.toLowerCase().includes('panel')
    );
    const hasBackupFiles = findings.some(f => 
      f.title.toLowerCase().includes('backup') || f.title.toLowerCase().includes('.sql')
    );
    
    if (hasAdminPanel && hasBackupFiles) {
      chains.push({
        type: 'credential_harvesting_chain',
        risk_score: 90,
        confidence: 0.85,
        likelihood: 0.8,
        impact: 0.9,
        attack_vectors: [
          'Harvest credentials from backup files',
          'Use credentials to access admin panel',
          'Escalate privileges',
          'Establish persistence'
        ],
        recommendations: [
          'Immediately secure backup files',
          'Change all admin credentials',
          'Implement file access monitoring',
          'Audit admin panel access logs'
        ]
      });
    }
    
    return chains;
  }

  private calculateOverallRiskScore(predictions: ThreatPrediction[]): number {
    if (predictions.length === 0) return 0;
    
    // Weighted average based on confidence and severity
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const prediction of predictions) {
      const weight = prediction.confidence * this.getSeverityWeight(prediction.severity);
      totalWeightedScore += prediction.risk_score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  private getSeverityWeight(severity: string): number {
    const weights = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    return weights[severity as keyof typeof weights] || 0.5;
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private determineSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    return this.determineRiskLevel(score);
  }

  private calculateLikelihood(threatType: string, findings: Finding[]): number {
    // Base likelihood on threat type and finding characteristics
    const baseLikelihood = {
      'exposed_admin_panel': 0.8,
      'sql_injection': 0.7,
      'exposed_backup_files': 0.9,
      'subdomain_takeover': 0.6,
      'exposed_api_endpoints': 0.7
    };
    
    let likelihood = baseLikelihood[threatType as keyof typeof baseLikelihood] || 0.5;
    
    // Adjust based on severity
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    likelihood += criticalCount * 0.1;
    
    return Math.min(1.0, Math.round(likelihood * 100) / 100);
  }

  private calculateImpact(threatType: string, findings: Finding[]): number {
    // Base impact scores
    const baseImpact = {
      'exposed_admin_panel': 0.9,
      'sql_injection': 0.95,
      'exposed_backup_files': 0.8,
      'subdomain_takeover': 0.7,
      'exposed_api_endpoints': 0.6
    };
    
    return baseImpact[threatType as keyof typeof baseImpact] || 0.5;
  }

  private analyzeAttackSurface(findings: Finding[]): any {
    return {
      exposed_services: findings.filter(f => f.type === 'service').length,
      critical_endpoints: findings.filter(f => 
        f.type === 'endpoint' && f.severity === 'critical'
      ).length,
      weak_configurations: findings.filter(f => 
        f.description.toLowerCase().includes('misconfiguration')
      ).length,
      data_exposure_risk: findings.filter(f => 
        f.description.toLowerCase().includes('data') ||
        f.description.toLowerCase().includes('information')
      ).length
    };
  }

  private async analyzeVulnerabilityTrends(projectId: string): Promise<any> {
    // TODO: Implement actual trend analysis from historical data
    return {
      increasing: ['API vulnerabilities', 'Configuration issues'],
      decreasing: ['SSL/TLS weaknesses'],
      stable: ['Information disclosure', 'Authentication issues']
    };
  }

  private estimateTimeToCompromise(
    predictions: ThreatPrediction[],
    findings: Finding[]
  ): string {
    const highestRisk = Math.max(...predictions.map(p => p.risk_score), 0);
    
    if (highestRisk >= 90) return 'Minutes to hours';
    if (highestRisk >= 70) return 'Hours to days';
    if (highestRisk >= 50) return 'Days to weeks';
    if (highestRisk >= 30) return 'Weeks to months';
    return 'Months or longer';
  }

  private generateRecommendations(
    predictions: ThreatPrediction[],
    findings: Finding[],
    attackSurface: any
  ): string[] {
    const recommendations = new Set<string>();
    
    // Add threat-specific recommendations
    predictions.forEach(prediction => {
      prediction.recommended_actions.forEach(action => {
        recommendations.add(action);
      });
    });
    
    // Add general recommendations based on attack surface
    if (attackSurface.exposed_services > 5) {
      recommendations.add('Reduce unnecessary exposed services');
    }
    
    if (attackSurface.critical_endpoints > 0) {
      recommendations.add('Immediately address critical endpoint vulnerabilities');
    }
    
    if (attackSurface.weak_configurations > 3) {
      recommendations.add('Implement configuration management and security hardening');
    }
    
    return Array.from(recommendations);
  }
}

interface RiskModel {
  base_score: number;
  factors: Record<string, number>;
}