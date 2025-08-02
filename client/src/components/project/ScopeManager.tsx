import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScopeManagerProps {
  projectId: string;
  currentScope: string[];
  onScopeUpdate: (newScope: string[]) => void;
}

export function ScopeManager({ projectId, currentScope, onScopeUpdate }: ScopeManagerProps) {
  const [newTarget, setNewTarget] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTarget = async () => {
    if (!newTarget.trim()) return;
    
    setIsAdding(true);
    try {
      const updatedScope = [...currentScope, newTarget.trim()];
      await updateProjectScope(projectId, updatedScope);
      onScopeUpdate(updatedScope);
      setNewTarget('');
    } catch (error) {
      console.error('Failed to add target:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTarget = async (targetToRemove: string) => {
    try {
      const updatedScope = currentScope.filter(target => target !== targetToRemove);
      await updateProjectScope(projectId, updatedScope);
      onScopeUpdate(updatedScope);
    } catch (error) {
      console.error('Failed to remove target:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Project Scope</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Only targets in this scope will be used for reconnaissance. 
            You have complete control over what gets tested.
          </AlertDescription>
        </Alert>

        <div>
          <Label className="text-sm font-medium">Current Targets</Label>
          <div className="mt-2 space-y-2">
            {currentScope.length === 0 ? (
              <p className="text-sm text-muted-foreground">No targets defined</p>
            ) : (
              currentScope.map((target, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{target}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTarget(target)}
                    data-testid={`button-remove-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newTarget">Add New Target</Label>
          <div className="flex space-x-2">
            <Input
              id="newTarget"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="example.com or 192.168.1.100"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTarget()}
              data-testid="input-new-target"
            />
            <Button
              onClick={handleAddTarget}
              disabled={!newTarget.trim() || isAdding}
              data-testid="button-add-target"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add domains, IPs, or specific URLs that you want to include in reconnaissance.
          </p>
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Scope Guidelines</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Only add targets you own or have explicit permission to test</li>
            <li>• Domains: example.com (exact match only)</li>
            <li>• IP addresses: 192.168.1.100 or ranges like 192.168.1.0/24</li>
            <li>• URLs: https://app.example.com/api (specific endpoints)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock function - replace with actual API call
async function updateProjectScope(projectId: string, scope: string[]) {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Updated scope for project', projectId, ':', scope);
}