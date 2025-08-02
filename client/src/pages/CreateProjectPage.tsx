import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Target, Shield, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

export function CreateProjectPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    scope: [''],
    plan: 'free' as 'free' | 'paid'
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleAddScope = () => {
    setFormData(prev => ({
      ...prev,
      scope: [...prev.scope, '']
    }));
  };

  const handleRemoveScope = (index: number) => {
    setFormData(prev => ({
      ...prev,
      scope: prev.scope.filter((_, i) => i !== index)
    }));
  };

  const handleScopeChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      scope: prev.scope.map((item, i) => i === index ? value : item)
    }));
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    
    try {
      // TODO: Replace with actual API call
      const project = await mockCreateProject(formData);
      setLocation(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = formData.name.trim() && formData.target.trim() && 
                 formData.scope.some(s => s.trim());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create New Project</h1>
              <p className="text-muted-foreground">
                Set up a new reconnaissance project
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Reconnaissance Project"
                    data-testid="input-project-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Primary Target</Label>
                  <Input
                    id="target"
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    placeholder="example.com"
                    data-testid="input-target"
                  />
                  <p className="text-sm text-muted-foreground">
                    Main domain or IP address to investigate
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Scope</Label>
                  <div className="space-y-2">
                    {formData.scope.map((scopeItem, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={scopeItem}
                          onChange={(e) => handleScopeChange(index, e.target.value)}
                          placeholder="*.example.com or 192.168.1.0/24"
                          className="flex-1"
                          data-testid={`input-scope-${index}`}
                        />
                        {formData.scope.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveScope(index)}
                            data-testid={`button-remove-scope-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddScope}
                    className="w-full"
                    disabled={formData.plan === 'free' && formData.scope.length >= 5}
                    data-testid="button-add-scope"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Scope Entry
                  </Button>
                  {formData.plan === 'free' && (
                    <p className="text-sm text-muted-foreground">
                      Free tier: Maximum 5 scope entries
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Plan Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.plan}
                  onValueChange={(value: 'free' | 'paid') => 
                    setFormData(prev => ({ ...prev, plan: value }))
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="free" id="free" />
                      <div className="flex-1">
                        <Label htmlFor="free" className="font-medium">
                          Free Plan
                        </Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          • Basic tools (subfinder, httpx, waybackurls)
                          <br />
                          • 5 basic recon runs per day
                          <br />
                          • Maximum 2 custom headers
                          <br />
                          • No exports
                        </div>
                      </div>
                      <Badge variant="secondary">$0/month</Badge>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="paid" id="paid" />
                      <div className="flex-1">
                        <Label htmlFor="paid" className="font-medium">
                          Pro Plan
                        </Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          • All tools (nmap, trufflehog, etc.)
                          <br />
                          • Unlimited recon runs
                          <br />
                          • Advanced AI models (GPT-4)
                          <br />
                          • Priority queue processing
                          <br />
                          • PDF exports and reports
                        </div>
                      </div>
                      <Badge>$29/month</Badge>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Link to="/">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleCreateProject}
                disabled={!isValid || isCreating}
                data-testid="button-create-project"
              >
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Free Tier</h4>
                  <div className="space-y-1 text-sm">
                    <div>• subfinder - Subdomain enumeration</div>
                    <div>• httpx - HTTP probe tool</div>
                    <div>• waybackurls - Historical URLs</div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Pro Only</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>• gau - URL collector</div>
                    <div>• paramspider - Parameter discovery</div>
                    <div>• arjun - HTTP parameter discovery</div>
                    <div>• kiterunner - Content discovery</div>
                    <div>• trufflehog - Secret scanner</div>
                    <div>• nmap - Network port scanner</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Enter your target domain or IP address</p>
                <p>2. Define the reconnaissance scope</p>
                <p>3. Choose your plan based on needed tools</p>
                <p>4. Start with "run basic recon" in chat</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock function - replace with actual API call
async function mockCreateProject(formData: any) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: `project_${Date.now()}`,
    ...formData,
    scope: formData.scope.filter((s: string) => s.trim()),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}