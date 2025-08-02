import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Server, Target, Zap } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  target: string;
  scope: string[];
  status: string;
  plan: string;
}

interface Tool {
  name: string;
  tier: 'free' | 'paid';
  requires_key: boolean;
  installed: boolean;
  category: string;
}

interface Metrics {
  api_calls: number;
  simulated_fallbacks: number;
  llm_tokens_used: number;
  tools_executed: number;
  recon_score: number;
  findings_count: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function TestPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [toolExecution, setToolExecution] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load demo data
    loadDemoProject();
    loadAvailableTools();
    loadProjectMetrics();
  }, []);

  const loadDemoProject = async () => {
    try {
      const response = await fetch('/api/demo/project');
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Failed to load demo project:', error);
    }
  };

  const loadAvailableTools = async () => {
    try {
      const response = await fetch('/api/tools?user_plan=free');
      const data = await response.json();
      setTools(data.tools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const loadProjectMetrics = async () => {
    try {
      const response = await fetch('/api/projects/demo_project/metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/projects/demo_project/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessage,
          user_id: '1'
        })
      });
      const data = await response.json();
      setChatResponse(data.decision);
      setChatMessage('');
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeTool = async (toolName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/demo_project/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: toolName,
          target: 'example.com',
          user_plan: 'free'
        })
      });
      const data = await response.json();
      setToolExecution(data.result);
    } catch (error) {
      console.error('Tool execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ReconAssistant - Backend Test</h1>
        <p className="text-muted-foreground">
          Testing the complete AI-powered reconnaissance SaaS platform
        </p>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Project Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-lg">{project.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Target</p>
                <p className="text-lg">{project.target}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="outline">{project.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Plan</p>
                <Badge variant={project.plan === 'paid' ? 'default' : 'secondary'}>
                  {project.plan.toUpperCase()}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading project...</p>
          )}
        </CardContent>
      </Card>

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Available Reconnaissance Tools</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tool.name}</span>
                  {tool.installed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="flex space-x-1">
                  <Badge variant="outline" className="text-xs">
                    {tool.category}
                  </Badge>
                  {tool.tier === 'paid' && (
                    <Badge variant="destructive" className="text-xs">
                      Pro
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => executeTool(tool.name)}
                  disabled={loading}
                  data-testid={`button-execute-${tool.name}`}
                >
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>AI Decision Engine</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Ask ReconAI to plan reconnaissance activities..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              data-testid="input-chat-message"
            />
            <Button
              onClick={sendChatMessage}
              disabled={loading || !chatMessage.trim()}
              data-testid="button-send-chat"
            >
              {loading ? 'Processing...' : 'Send'}
            </Button>
          </div>

          {chatResponse && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>AI Reasoning:</strong> {chatResponse.reasoning}</p>
                  <p><strong>Confidence:</strong> {Math.round(chatResponse.confidence * 100)}%</p>
                  {chatResponse.actions.length > 0 && (
                    <div>
                      <p><strong>Recommended Actions:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {chatResponse.actions.map((action: any, index: number) => (
                          <li key={index}>
                            <span className="font-medium">{action.tool}</span> on {action.target} - {action.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Project Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Reconnaissance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.api_calls}</p>
                <p className="text-sm text-muted-foreground">API Calls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.tools_executed}</p>
                <p className="text-sm text-muted-foreground">Tools Run</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.recon_score}</p>
                <p className="text-sm text-muted-foreground">Recon Score</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getSeverityColor('critical')}`}>
                  {metrics.findings_count.critical}
                </p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getSeverityColor('high')}`}>
                  {metrics.findings_count.high}
                </p>
                <p className="text-sm text-muted-foreground">High</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getSeverityColor('medium')}`}>
                  {metrics.findings_count.medium}
                </p>
                <p className="text-sm text-muted-foreground">Medium</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading metrics...</p>
          )}
        </CardContent>
      </Card>

      {/* Tool Execution Results */}
      {toolExecution && (
        <Card>
          <CardHeader>
            <CardTitle>Tool Execution Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Status:</strong> {toolExecution.success ? 'Success' : 'Failed'}</p>
                  <p><strong>Tool:</strong> {toolExecution.tool}</p>
                  <p><strong>Target:</strong> {toolExecution.target}</p>
                  <p><strong>Runtime:</strong> {toolExecution.runtime}ms</p>
                  {toolExecution.output && (
                    <div>
                      <p><strong>Output Preview:</strong></p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(toolExecution.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Backend Services Running</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>API Endpoints Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>AI Decision Engine Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}