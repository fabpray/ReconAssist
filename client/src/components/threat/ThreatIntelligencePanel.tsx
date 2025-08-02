import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, TrendingDown, Clock, Target, Brain, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ThreatPrediction {
  id: string;
  threat_type: string;
  risk_score: number;
  confidence: number;
  predicted_attack_vectors: string[];
  recommended_actions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  impact: number;
}

interface RiskAssessment {
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

interface ThreatIntelligencePanelProps {
  projectId: string;
}

export function ThreatIntelligencePanel({ projectId }: ThreatIntelligencePanelProps) {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThreatIntelligence();
  }, [projectId]);

  const loadThreatIntelligence = async () => {
    try {
      // TODO: Replace with actual API call
      const assessment = await mockGetRiskAssessment(projectId);
      setRiskAssessment(assessment);
    } catch (error) {
      console.error('Failed to load threat intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-40 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!riskAssessment) {
    return (
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          No threat intelligence available. Run reconnaissance to generate predictions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Risk Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getRiskScoreColor(riskAssessment.overall_risk_score)}`}>
                {riskAssessment.overall_risk_score}
              </div>
              <Progress 
                value={riskAssessment.overall_risk_score} 
                className="mb-2"
              />
              <Badge 
                variant={getRiskLevelVariant(riskAssessment.risk_level)}
                className="text-sm"
              >
                {riskAssessment.risk_level.toUpperCase()} RISK
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attack Surface</span>
                <span className="text-sm text-muted-foreground">
                  {riskAssessment.attack_surface_analysis.exposed_services} services
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Critical Issues</span>
                <span className="text-sm text-muted-foreground">
                  {riskAssessment.attack_surface_analysis.critical_endpoints}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Exposure</span>
                <span className="text-sm text-muted-foreground">
                  {riskAssessment.attack_surface_analysis.data_exposure_risk} risks
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-medium">Time to Compromise</p>
              <p className="text-sm text-muted-foreground">
                {riskAssessment.time_to_compromise_estimate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="threats">Threat Predictions</TabsTrigger>
          <TabsTrigger value="trends">Vulnerability Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          {riskAssessment.primary_threats.length === 0 ? (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                No active threat predictions. This is good news!
              </AlertDescription>
            </Alert>
          ) : (
            riskAssessment.primary_threats.map((threat) => (
              <ThreatPredictionCard key={threat.id} threat={threat} />
            ))
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <VulnerabilityTrendsCard trends={riskAssessment.vulnerability_trends} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <RecommendationsCard recommendations={riskAssessment.recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ThreatPredictionCard({ threat }: { threat: ThreatPrediction }) {
  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize">
            {threat.threat_type.replace(/_/g, ' ')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={getRiskLevelVariant(threat.severity)}>
              {threat.severity}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {Math.round(threat.confidence * 100)}% confidence
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Predicted Attack Vectors
            </h4>
            <ul className="text-sm space-y-1">
              {threat.predicted_attack_vectors.slice(0, 3).map((vector, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{vector}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Risk Metrics
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Risk Score:</span>
                <span className="font-medium">{threat.risk_score}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Likelihood:</span>
                <span className="font-medium">{Math.round(threat.likelihood * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Impact:</span>
                <span className="font-medium">{Math.round(threat.impact * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Recommended Actions</h4>
          <div className="space-y-1">
            {threat.recommended_actions.slice(0, 2).map((action, index) => (
              <div key={index} className="text-sm bg-muted p-2 rounded">
                {action}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VulnerabilityTrendsCard({ trends }: { trends: RiskAssessment['vulnerability_trends'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Vulnerability Trends</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="font-medium text-sm">Increasing</span>
            </div>
            <div className="space-y-1">
              {trends.increasing.map((trend, index) => (
                <div key={index} className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded">
                  {trend}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="font-medium text-sm">Decreasing</span>
            </div>
            <div className="space-y-1">
              {trends.decreasing.map((trend, index) => (
                <div key={index} className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded">
                  {trend}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-4 w-4 bg-gray-400 rounded-full" />
              <span className="font-medium text-sm">Stable</span>
            </div>
            <div className="space-y-1">
              {trends.stable.map((trend, index) => (
                <div key={index} className="text-sm bg-muted p-2 rounded">
                  {trend}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({ recommendations }: { recommendations: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>AI Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <p className="text-sm flex-1">{recommendation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'text-red-600 dark:text-red-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

function getRiskLevelVariant(level: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (level) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
}

// Mock function - replace with actual API call
async function mockGetRiskAssessment(projectId: string): Promise<RiskAssessment> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    overall_risk_score: 72,
    risk_level: 'high',
    primary_threats: [
      {
        id: 'threat_1',
        threat_type: 'exposed_admin_panel',
        risk_score: 85,
        confidence: 0.9,
        predicted_attack_vectors: [
          'Brute force authentication',
          'Default credential exploitation',
          'Session hijacking',
          'Privilege escalation'
        ],
        recommended_actions: [
          'Implement strong authentication mechanisms',
          'Add IP whitelisting for admin access',
          'Enable multi-factor authentication'
        ],
        severity: 'critical',
        likelihood: 0.8,
        impact: 0.9
      },
      {
        id: 'threat_2',
        threat_type: 'sql_injection',
        risk_score: 78,
        confidence: 0.85,
        predicted_attack_vectors: [
          'Database enumeration',
          'Data exfiltration',
          'Authentication bypass'
        ],
        recommended_actions: [
          'Use parameterized queries',
          'Implement input validation',
          'Apply principle of least privilege'
        ],
        severity: 'high',
        likelihood: 0.7,
        impact: 0.95
      },
      {
        id: 'threat_3',
        threat_type: 'exposed_backup_files',
        risk_score: 65,
        confidence: 0.95,
        predicted_attack_vectors: [
          'Credential harvesting',
          'Source code analysis',
          'Configuration exploitation'
        ],
        recommended_actions: [
          'Remove sensitive files from web directories',
          'Implement proper file permissions'
        ],
        severity: 'medium',
        likelihood: 0.9,
        impact: 0.7
      }
    ],
    vulnerability_trends: {
      increasing: ['API vulnerabilities', 'Configuration issues'],
      decreasing: ['SSL/TLS weaknesses'],
      stable: ['Information disclosure', 'Authentication issues']
    },
    attack_surface_analysis: {
      exposed_services: 12,
      critical_endpoints: 3,
      weak_configurations: 5,
      data_exposure_risk: 7
    },
    time_to_compromise_estimate: 'Hours to days',
    recommendations: [
      'Immediately secure exposed admin panels with strong authentication',
      'Fix SQL injection vulnerabilities in user input forms',
      'Remove backup files from publicly accessible directories',
      'Implement comprehensive security monitoring',
      'Conduct regular security assessments',
      'Establish incident response procedures'
    ]
  };
}