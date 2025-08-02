import { useState } from 'react';
import { Settings, Key, Shield, Zap, Target, Headers, Play, Pause, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Tool {
  name: string;
  tier: 'free' | 'paid';
  requires_key: boolean;
  enabled: boolean;
  category: string;
  installed: boolean;
}

interface ProjectSidebarProps {
  projectId: string;
  userPlan: 'free' | 'paid';
  availableTools: Tool[];
  onToolToggle: (toolName: string, enabled: boolean) => void;
  onScopeChange: (scope: string[]) => void;
  onHeaderChange: (headers: Record<string, string>) => void;
}

export function ProjectSidebar({ 
  projectId, 
  userPlan, 
  availableTools, 
  onToolToggle,
  onScopeChange,
  onHeaderChange 
}: ProjectSidebarProps) {
  const [activeTab, setActiveTab] = useState('tools');

  return (
    <div className="w-80 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Project Controls</span>
        </h2>
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant={userPlan === 'paid' ? 'default' : 'secondary'}>
            {userPlan.toUpperCase()}
          </Badge>
          {userPlan === 'free' && (
            <Button variant="outline" size="sm">
              Upgrade
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="keys">Keys</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="tools" className="p-4 space-y-4">
            <ToolsPanel 
              tools={availableTools}
              userPlan={userPlan}
              onToolToggle={onToolToggle}
            />
          </TabsContent>

          <TabsContent value="scope" className="p-4">
            <ScopePanel 
              projectId={projectId}
              userPlan={userPlan}
              onScopeChange={onScopeChange}
            />
          </TabsContent>

          <TabsContent value="headers" className="p-4">
            <HeadersPanel 
              projectId={projectId}
              userPlan={userPlan}
              onHeaderChange={onHeaderChange}
            />
          </TabsContent>

          <TabsContent value="keys" className="p-4">
            <KeysPanel 
              userPlan={userPlan}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ToolsPanel({ tools, userPlan, onToolToggle }: {
  tools: Tool[];
  userPlan: 'free' | 'paid';
  onToolToggle: (toolName: string, enabled: boolean) => void;
}) {
  const categories = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'subdomain': return Target;
      case 'endpoint': return Zap;
      case 'vulnerability': return Shield;
      case 'secret': return Key;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Available Tools</h3>
        <Badge variant="outline">{tools.length} tools</Badge>
      </div>

      {Object.entries(categories).map(([category, categoryTools]) => {
        const IconComponent = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center space-x-2">
                <IconComponent className="h-4 w-4" />
                <span className="capitalize">{category}</span>
                <Badge variant="outline" className="text-xs">
                  {categoryTools.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryTools.map((tool) => (
                <ToolItem
                  key={tool.name}
                  tool={tool}
                  userPlan={userPlan}
                  onToggle={onToolToggle}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ToolItem({ tool, userPlan, onToggle }: {
  tool: Tool;
  userPlan: 'free' | 'paid';
  onToggle: (toolName: string, enabled: boolean) => void;
}) {
  const isPaidTool = tool.tier === 'paid';
  const canUse = userPlan === 'paid' || !isPaidTool;
  const needsUpgrade = isPaidTool && userPlan === 'free' && !tool.requires_key;

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{tool.name}</span>
          {tool.installed ? (
            <Badge variant="outline" className="text-xs">Real</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Mock</Badge>
          )}
          {isPaidTool && (
            <Badge variant="destructive" className="text-xs">Pro</Badge>
          )}
        </div>
        {needsUpgrade && (
          <p className="text-xs text-muted-foreground">Upgrade required</p>
        )}
        {tool.requires_key && (
          <p className="text-xs text-muted-foreground">API key required</p>
        )}
      </div>
      
      <Switch
        checked={tool.enabled && canUse}
        disabled={!canUse}
        onCheckedChange={(checked) => onToggle(tool.name, checked)}
        data-testid={`switch-tool-${tool.name}`}
      />
    </div>
  );
}

function ScopePanel({ projectId, userPlan, onScopeChange }: {
  projectId: string;
  userPlan: 'free' | 'paid';
  onScopeChange: (scope: string[]) => void;
}) {
  const maxScopeEntries = userPlan === 'free' ? 5 : 100;
  const currentScope = ['example.com']; // TODO: Get from props
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Project Scope</h3>
        <Badge variant="outline">
          {currentScope.length}/{maxScopeEntries}
        </Badge>
      </div>

      <Progress 
        value={(currentScope.length / maxScopeEntries) * 100} 
        className="h-2"
      />

      {userPlan === 'free' && currentScope.length >= 4 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Approaching free tier limit of {maxScopeEntries} scope entries.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {currentScope.map((target, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm">{target}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const newScope = currentScope.filter((_, i) => i !== index);
                onScopeChange(newScope);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button 
        className="w-full" 
        disabled={currentScope.length >= maxScopeEntries}
        data-testid="button-add-scope"
      >
        Add Target
      </Button>
    </div>
  );
}

function HeadersPanel({ projectId, userPlan, onHeaderChange }: {
  projectId: string;
  userPlan: 'free' | 'paid';
  onHeaderChange: (headers: Record<string, string>) => void;
}) {
  const maxHeaders = userPlan === 'free' ? 2 : 20;
  const currentHeaders = {}; // TODO: Get from props
  const headerCount = Object.keys(currentHeaders).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Custom Headers</h3>
        <Badge variant="outline">
          {headerCount}/{maxHeaders}
        </Badge>
      </div>

      <Progress 
        value={(headerCount / maxHeaders) * 100} 
        className="h-2"
      />

      {userPlan === 'free' && (
        <Alert>
          <Headers className="h-4 w-4" />
          <AlertDescription>
            Free plan limited to {maxHeaders} custom headers. 
            <Button variant="link" className="p-0 h-auto">Upgrade for more</Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          No custom headers configured
        </div>
      </div>

      <Button 
        className="w-full" 
        disabled={headerCount >= maxHeaders}
        data-testid="button-add-header"
      >
        Add Header
      </Button>
    </div>
  );
}

function KeysPanel({ userPlan }: {
  userPlan: 'free' | 'paid';
}) {
  const supportedServices = [
    'shodan', 'securitytrails', 'censys', 'virustotal', 'builtwith'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">API Keys</h3>
        <Badge variant="outline">BYOK</Badge>
      </div>

      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Add your own API keys to access premium reconnaissance services.
          Keys are encrypted and stored securely.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        {supportedServices.map((service) => (
          <div key={service} className="flex items-center justify-between p-2 border rounded">
            <div>
              <span className="text-sm font-medium capitalize">{service}</span>
              <p className="text-xs text-muted-foreground">Not configured</p>
            </div>
            <Button variant="outline" size="sm">
              Add Key
            </Button>
          </div>
        ))}
      </div>

      {userPlan === 'free' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Free users can only use their own API keys. 
            <Button variant="link" className="p-0 h-auto">Upgrade</Button> for fallback access.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}