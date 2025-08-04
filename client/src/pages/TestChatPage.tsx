import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/chat/ChatInterface';

export function TestChatPage() {
  const [projectId] = useState('project_1754327324484_7otynanwy');
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Chat Interface Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test the AI-powered chat interface with real backend integration.
              Try commands like:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• "run basic recon"</li>
              <li>• "find subdomains for example.com"</li>
              <li>• "check for endpoints"</li>
              <li>• "scan for vulnerabilities"</li>
            </ul>
          </CardContent>
        </Card>
        
        <div className="h-[600px] border border-border rounded-lg">
          <ChatInterface 
            projectId={projectId}
            projectName="Test Project"
            target="example.com"
          />
        </div>
      </div>
    </div>
  );
}