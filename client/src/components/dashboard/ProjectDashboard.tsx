import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Download, Users, Shield, Target, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ChatInterface } from '../chat/ChatInterface';
import { ThreatIntelligencePanel } from '../threat/ThreatIntelligencePanel';
import { ScopeManager } from '../project/ScopeManager';
import { ReconScore, Finding, Project } from '@shared/types';
import { Link } from 'wouter';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [reconScore, setReconScore] = useState<ReconScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      // Load project from backend
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
      } else {
        console.error('Failed to load project');
      }

      // Load project metrics
      const metricsResponse = await fetch(`/api/projects/${projectId}/metrics`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setReconScore(metricsData.metrics);
      } else {
        console.error('Failed to load metrics');
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Project not found</p>
          <Link to="/">
            <Button className="mt-4">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Target: {project.target} • {project.plan} plan
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          {project.plan === 'paid' && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card p-4 space-y-4">
          {/* Recon Score */}
          {reconScore && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Recon Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {reconScore.total_score}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Findings</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical</span>
                    <Badge variant="destructive">
                      {reconScore.severity_breakdown.critical}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High</span>
                    <Badge variant="destructive" className="bg-orange-500">
                      {reconScore.severity_breakdown.high}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium</span>
                    <Badge variant="secondary">
                      {reconScore.severity_breakdown.medium}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low</span>
                    <Badge variant="outline">
                      {reconScore.severity_breakdown.low}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Scope */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.scope.map((item: string, index: number) => (
                  <div key={index} className="text-sm bg-muted p-2 rounded">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Findings */}
          {reconScore?.top_findings && reconScore.top_findings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Top Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reconScore.top_findings.slice(0, 3).map((finding: Finding) => (
                  <div key={finding.id} className="border-l-2 border-primary pl-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{finding.title}</p>
                      <Badge 
                        variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {finding.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{finding.target}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 w-fit">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="scope">Scope</TabsTrigger>
              <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 m-4 mt-2">
              <Card className="h-full">
                <ChatInterface 
                  projectId={project.id}
                  projectName={project.name}
                  target={project.target}
                />
              </Card>
            </TabsContent>
            
            <TabsContent value="scope" className="flex-1 m-4 mt-2 overflow-y-auto">
              <ScopeManager 
                projectId={project.id}
                currentScope={project.scope}
                onScopeUpdate={(newScope) => {
                  // Update the project state
                  setProject((prev: Project | null) => prev ? { ...prev, scope: newScope } : null);
                }}
              />
            </TabsContent>

            <TabsContent value="threats" className="flex-1 m-4 mt-2 overflow-y-auto">
              <ThreatIntelligencePanel projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="findings" className="flex-1 m-4 mt-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Security Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  <FindingsList projectId={project.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="flex-1 m-4 mt-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLog projectId={project.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function FindingsList({ projectId }: { projectId: string }) {
  const [findings, setFindings] = useState<Finding[]>([]);

  useEffect(() => {
    // TODO: Load actual findings
    setFindings(mockFindings);
  }, [projectId]);

  return (
    <div className="space-y-4">
      {findings.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No findings yet. Start reconnaissance to discover security issues.
        </p>
      ) : (
        findings.map((finding) => (
          <Card key={finding.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{finding.title}</CardTitle>
                <Badge 
                  variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}
                >
                  {finding.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Target: {finding.target}</span>
                <span>{new Date(finding.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ActivityLog({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Activity log will show tool executions and findings discovery.</p>
      </div>
    </div>
  );
}

// Mock data functions - replace with actual API calls
async function mockGetProject(projectId: string): Promise<Project> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    id: projectId,
    user_id: 'user_123',
    name: 'Demo Project',
    target: 'testphp.vulnweb.com',
    scope: ['*.testphp.vulnweb.com', 'testphp.vulnweb.com'],
    status: 'active',
    plan: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function mockGetReconScore(projectId: string): Promise<ReconScore> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    total_score: 12,
    severity_breakdown: {
      critical: 2,
      high: 3,
      medium: 5,
      low: 2
    },
    top_findings: mockFindings.slice(0, 3)
  };
}

const mockFindings: Finding[] = [
  {
    id: 'finding_1',
    project_id: 'demo_project',
    run_id: 'run_1',
    type: 'subdomain',
    severity: 'high',
    title: 'Exposed Admin Panel',
    description: 'Admin panel accessible without authentication',
    target: 'admin.testphp.vulnweb.com',
    metadata: { status_code: 200 },
    created_at: new Date().toISOString()
  },
  {
    id: 'finding_2',
    project_id: 'demo_project',
    run_id: 'run_2',
    type: 'endpoint',
    severity: 'critical',
    title: 'SQL Injection Vulnerability',
    description: 'Potential SQL injection in login form',
    target: 'testphp.vulnweb.com/login.php',
    metadata: { parameter: 'username' },
    created_at: new Date().toISOString()
  },
  {
    id: 'finding_3',
    project_id: 'demo_project',
    run_id: 'run_3',
    type: 'file',
    severity: 'medium',
    title: 'Backup File Exposed',
    description: 'Database backup file accessible via direct URL',
    target: 'testphp.vulnweb.com/backup.sql',
    metadata: { size: '2.3MB' },
    created_at: new Date().toISOString()
  }
];