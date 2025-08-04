import { Project, Finding } from '../../shared/types';

export interface ThreatPrediction {
  threat_type: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasoning: string;
  recommended_actions: string[];
}

export interface RiskAssessment {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
  predictions: ThreatPrediction[];
  recommendations: string[];
  coverage_metrics: {
    domains_covered: number;
    endpoints_discovered: number;
    vulnerabilities_found: number;
    secrets_detected: number;
  };
}

interface RiskFactor {
  factor: string;
  weight: number;
  present: boolean;
  description: string;
}

export class ThreatIntelligenceEngine {
  private riskFactors: RiskFactor[] = [];

  constructor() {
    this.initializeRiskFactors();
  }

  private initializeRiskFactors(): void {
    this.riskFactors = [
      {
        factor: 'exposed_admin_panels',
        weight: 0.9,
        present: false,
        description: 'Administrative interfaces accessible without proper authentication'
      },
      {
        factor: 'leaked_credentials',
        weight: 0.95,
        present: false,
        description: 'Authentication credentials found in public repositories or dumps'
      },
      {
        factor: 'misconfigured_services',
        weight: 0.8,
        present: false,
        description: 'Services running with default or weak configurations'
      },
      {
        factor: 'exposed_sensitive_files',
        weight: 0.85,
        present: false,
        description: 'Configuration files, backups, or sensitive documents publicly accessible'
      },
      {
        factor: 'subdomain_takeover',
        weight: 0.75,
        present: false,
        description: 'Subdomains pointing to unclaimed external services'
      },
      {
        factor: 'weak_ssl_configuration',
        weight: 0.6,
        present: false,
        description: 'SSL/TLS implementation with known vulnerabilities'
      },
      {
        factor: 'directory_listing',
        weight: 0.5,
        present: false,
        description: 'Web directories allowing file browsing'
      },
      {
        factor: 'exposed_development_files',
        weight: 0.7,
        present: false,
        description: 'Development artifacts like .git directories or backup files'
      }
    ];
  }

  async analyzeFindings(projectId: string, findings: any[]): Promise<ThreatPrediction[]> {
    const predictions: ThreatPrediction[] = [];

    // Update risk factors based on findings
    this.updateRiskFactors(findings);

    // Generate threat predictions based on findings patterns
    if (this.hasAdminPanels(findings)) {
      predictions.push({
        threat_type: 'Administrative Access',
        probability: 0.8,
        impact: 'critical',
        confidence: 0.9,
        reasoning: 'Exposed administrative interfaces increase risk of unauthorized access',
        recommended_actions: [
          'Implement proper authentication mechanisms',
          'Restrict admin access to specific IP ranges',
          'Enable multi-factor authentication'
        ]
      });
    }

    if (this.hasLeakedSecrets(findings)) {
      predictions.push({
        threat_type: 'Credential Compromise',
        probability: 0.9,
        impact: 'critical',
        confidence: 0.95,
        reasoning: 'Leaked credentials provide direct access to systems and data',
        recommended_actions: [
          'Immediately rotate compromised credentials',
          'Audit systems for unauthorized access',
          'Implement credential scanning in CI/CD'
        ]
      });
    }

    if (this.hasSubdomainRisks(findings)) {
      predictions.push({
        threat_type: 'Subdomain Takeover',
        probability: 0.6,
        impact: 'high',
        confidence: 0.7,
        reasoning: 'Dangling subdomains can be claimed by attackers for phishing or malware',
        recommended_actions: [
          'Remove DNS records for unused subdomains',
          'Implement subdomain monitoring',
          'Use wildcard certificates with caution'
        ]
      });
    }

    if (this.hasExposedFiles(findings)) {
      predictions.push({
        threat_type: 'Information Disclosure',
        probability: 0.7,
        impact: 'medium',
        confidence: 0.8,
        reasoning: 'Exposed files may contain sensitive information or system details',
        recommended_actions: [
          'Remove or protect sensitive files',
          'Implement proper access controls',
          'Regular security scanning'
        ]
      });
    }

    return predictions;
  }

  async generateRiskAssessment(project: Project, findings: any[], predictions: ThreatPrediction[]): Promise<RiskAssessment> {
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(findings, predictions);
    const riskLevel = this.getRiskLevel(riskScore);

    // Update risk factors based on findings
    this.updateRiskFactors(findings);

    // Generate coverage metrics
    const coverageMetrics = this.calculateCoverageMetrics(findings);

    // Generate recommendations
    const recommendations = this.generateRecommendations(predictions, riskScore);

    return {
      overall_risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: this.riskFactors.filter(factor => factor.present),
      predictions,
      recommendations,
      coverage_metrics: coverageMetrics
    };
  }

  private calculateRiskScore(findings: any[], predictions: ThreatPrediction[]): number {
    let score = 0;
    let totalWeight = 0;

    // Factor in active risk factors
    this.riskFactors.forEach(factor => {
      if (factor.present) {
        score += factor.weight * 100;
        totalWeight += factor.weight;
      }
    });

    // Factor in threat predictions
    predictions.forEach(prediction => {
      const impactMultiplier = this.getImpactMultiplier(prediction.impact);
      score += prediction.probability * prediction.confidence * impactMultiplier * 100;
      totalWeight += prediction.confidence;
    });

    // Factor in finding severity
    const severityScore = this.calculateSeverityScore(findings);
    score += severityScore;
    totalWeight += 1;

    // Normalize score
    const normalizedScore = totalWeight > 0 ? Math.min(score / totalWeight, 100) : 0;
    
    return Math.round(normalizedScore);
  }

  private calculateSeverityScore(findings: any[]): number {
    const severityWeights: Record<string, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    let score = 0;
    findings.forEach(finding => {
      score += severityWeights[finding.severity] || 0;
    });

    return Math.min(score / Math.max(findings.length, 1), 100);
  }

  private getImpactMultiplier(impact: string): number {
    const multipliers: Record<string, number> = {
      critical: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4
    };
    return multipliers[impact] || 0.5;
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private updateRiskFactors(findings: any[]): void {
    // Reset all factors
    this.riskFactors.forEach(factor => factor.present = false);

    findings.forEach(finding => {
      const title = finding.title?.toLowerCase() || '';
      const description = finding.description?.toLowerCase() || '';
      const content = `${title} ${description}`;

      if (content.includes('admin') || content.includes('administrator')) {
        this.getRiskFactor('exposed_admin_panels').present = true;
      }

      if (content.includes('secret') || content.includes('password') || content.includes('key')) {
        this.getRiskFactor('leaked_credentials').present = true;
      }

      if (content.includes('.git') || content.includes('backup') || content.includes('.env')) {
        this.getRiskFactor('exposed_development_files').present = true;
      }

      if (content.includes('directory') || content.includes('listing')) {
        this.getRiskFactor('directory_listing').present = true;
      }

      if (finding.type === 'subdomain' && content.includes('dangling')) {
        this.getRiskFactor('subdomain_takeover').present = true;
      }
    });
  }

  private getRiskFactor(factorName: string): RiskFactor {
    return this.riskFactors.find(f => f.factor === factorName) || this.riskFactors[0];
  }

  private hasAdminPanels(findings: any[]): boolean {
    return findings.some(f => 
      f.title?.toLowerCase().includes('admin') || 
      f.description?.toLowerCase().includes('admin')
    );
  }

  private hasLeakedSecrets(findings: any[]): boolean {
    return findings.some(f => 
      f.type === 'secret' || 
      f.title?.toLowerCase().includes('secret') ||
      f.title?.toLowerCase().includes('password')
    );
  }

  private hasSubdomainRisks(findings: any[]): boolean {
    return findings.some(f => f.type === 'subdomain');
  }

  private hasExposedFiles(findings: any[]): boolean {
    return findings.some(f => 
      f.title?.toLowerCase().includes('.env') ||
      f.title?.toLowerCase().includes('backup') ||
      f.title?.toLowerCase().includes('.git')
    );
  }

  private calculateCoverageMetrics(findings: any[]): {
    domains_covered: number;
    endpoints_discovered: number;
    vulnerabilities_found: number;
    secrets_detected: number;
  } {
    const domains = new Set();
    let endpoints = 0;
    let vulnerabilities = 0;
    let secrets = 0;

    findings.forEach(finding => {
      if (finding.type === 'subdomain') {
        domains.add(finding.title);
      } else if (finding.type === 'endpoint') {
        endpoints++;
      } else if (finding.type === 'vulnerability') {
        vulnerabilities++;
      } else if (finding.type === 'secret') {
        secrets++;
      }
    });

    return {
      domains_covered: domains.size,
      endpoints_discovered: endpoints,
      vulnerabilities_found: vulnerabilities,
      secrets_detected: secrets
    };
  }

  private generateRecommendations(predictions: ThreatPrediction[], riskScore: number): string[] {
    const recommendations: string[] = [];

    // General recommendations based on risk score
    if (riskScore >= 80) {
      recommendations.push('Immediate security review required - critical vulnerabilities detected');
      recommendations.push('Consider engaging external security experts for incident response');
    } else if (riskScore >= 60) {
      recommendations.push('Prioritize fixing high-severity findings within 1-2 weeks');
      recommendations.push('Implement additional monitoring and alerting');
    } else if (riskScore >= 40) {
      recommendations.push('Address medium-severity findings as part of regular maintenance');
      recommendations.push('Review and update security policies');
    } else {
      recommendations.push('Continue regular security assessments');
      recommendations.push('Maintain current security practices');
    }

    // Add specific recommendations from predictions
    predictions.forEach(prediction => {
      if (prediction.probability > 0.7) {
        recommendations.push(...prediction.recommended_actions);
      }
    });

    // Remove duplicates and limit to most important
    const uniqueRecommendations = Array.from(new Set(recommendations));
    return uniqueRecommendations.slice(0, 8);
  }

  // Public methods for real-time threat analysis
  assessThreatLevel(findings: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount >= 3) return 'high';
    if (highCount > 0 || findings.length > 10) return 'medium';
    return 'low';
  }

  calculateReconScore(coverageMetrics: any): number {
    // Calculate completeness score out of 100
    const domainWeight = 30;
    const endpointWeight = 40;
    const vulnerabilityWeight = 20;
    const secretWeight = 10;

    const domainScore = Math.min(coverageMetrics.domains_covered * 10, domainWeight);
    const endpointScore = Math.min(coverageMetrics.endpoints_discovered * 2, endpointWeight);
    const vulnScore = Math.min(coverageMetrics.vulnerabilities_found * 5, vulnerabilityWeight);
    const secretScore = Math.min(coverageMetrics.secrets_detected * 10, secretWeight);

    return Math.round(domainScore + endpointScore + vulnScore + secretScore);
  }

  assessThreats(findings: any[]): any {
    // Assess threat level based on findings
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    
    let threatLevel = 'low';
    if (criticalFindings > 0) {
      threatLevel = 'critical';
    } else if (highFindings > 2) {
      threatLevel = 'high';
    } else if (highFindings > 0) {
      threatLevel = 'medium';
    }

    return {
      overall_risk: threatLevel,
      findings_count: findings.length,
      critical_count: criticalFindings,
      high_count: highFindings,
      recommendations: this.generateSimpleRecommendations(findings)
    };
  }

  private generateSimpleRecommendations(findings: any[]): string[] {
    const recommendations = [];
    
    if (findings.some(f => f.type === 'endpoint' && f.severity === 'critical')) {
      recommendations.push('Immediately secure exposed administrative interfaces');
    }
    
    if (findings.some(f => f.type === 'subdomain')) {
      recommendations.push('Review and secure all discovered subdomains');
    }
    
    return recommendations;
  }
}