import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Check, Target, Shield, Zap, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';

interface OnboardingData {
  userType: 'security_professional' | 'developer' | 'student' | 'other';
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  projectName: string;
  target: string;
  plan: 'free' | 'paid';
  notifications: boolean;
}

const steps = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with ReconAI' },
  { id: 'profile', title: 'Profile', description: 'Tell us about yourself' },
  { id: 'goals', title: 'Goals', description: 'What do you want to achieve?' },
  { id: 'project', title: 'First Project', description: 'Set up your first reconnaissance project' },
  { id: 'plan', title: 'Plan Selection', description: 'Choose your plan' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' }
];

const userTypes = [
  { id: 'security_professional', label: 'Security Professional', icon: Shield },
  { id: 'developer', label: 'Developer', icon: Zap },
  { id: 'student', label: 'Student/Researcher', icon: Users },
  { id: 'other', label: 'Other', icon: Target }
];

const goalOptions = [
  'Discover subdomains and attack surface',
  'Find exposed endpoints and APIs',
  'Identify security vulnerabilities',
  'Monitor for data leaks and secrets',
  'Assess network infrastructure',
  'Compliance and security auditing'
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const [data, setData] = useState<OnboardingData>({
    userType: 'security_professional',
    experience: 'intermediate',
    goals: [],
    projectName: '',
    target: '',
    plan: 'free',
    notifications: true
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // TODO: Save user preferences and create first project
      console.log('Onboarding completed:', data);
      
      // Create the project and navigate to it
      const project = await mockCreateProject({
        name: data.projectName,
        target: data.target,
        scope: [data.target], // Only include exactly what user specified
        plan: data.plan
      });
      
      setLocation(`/project/${project.id}`);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const isStepValid = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'profile':
        return data.userType && data.experience;
      case 'goals':
        return data.goals.length > 0;
      case 'project':
        return data.projectName.trim() && data.target.trim();
      case 'plan':
        return data.plan;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ReconAI</span>
          </div>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {steps[currentStep].id === 'welcome' && (
            <WelcomeStep />
          )}

          {steps[currentStep].id === 'profile' && (
            <ProfileStep data={data} updateData={updateData} />
          )}

          {steps[currentStep].id === 'goals' && (
            <GoalsStep data={data} updateData={updateData} />
          )}

          {steps[currentStep].id === 'project' && (
            <ProjectStep data={data} updateData={updateData} />
          )}

          {steps[currentStep].id === 'plan' && (
            <PlanStep data={data} updateData={updateData} />
          )}

          {steps[currentStep].id === 'complete' && (
            <CompleteStep data={data} />
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              data-testid="button-prev"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!isStepValid()}
                data-testid="button-complete"
              >
                Complete Setup
                <Check className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                data-testid="button-next"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
        <Shield className="h-12 w-12 text-primary" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-4">Welcome to ReconAI</h3>
        <p className="text-muted-foreground leading-relaxed">
          ReconAI is your AI-powered security reconnaissance platform. We'll help you discover 
          vulnerabilities, map attack surfaces, and enhance your security posture with intelligent 
          automation.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <Target className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm font-medium">Smart Discovery</p>
        </div>
        <div className="space-y-2">
          <Zap className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm font-medium">AI-Powered</p>
        </div>
        <div className="space-y-2">
          <Shield className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm font-medium">Security First</p>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">What best describes you?</Label>
        <RadioGroup
          value={data.userType}
          onValueChange={(value: OnboardingData['userType']) => updateData({ userType: value })}
          className="grid grid-cols-2 gap-4"
        >
          {userTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value={type.id} id={type.id} />
              <Label htmlFor={type.id} className="flex items-center space-x-2 cursor-pointer">
                <type.icon className="h-5 w-5" />
                <span>{type.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium mb-4 block">Your experience level?</Label>
        <RadioGroup
          value={data.experience}
          onValueChange={(value: OnboardingData['experience']) => updateData({ experience: value })}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2 border rounded-lg p-3">
            <RadioGroupItem value="beginner" id="beginner" />
            <Label htmlFor="beginner" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Beginner</p>
                <p className="text-sm text-muted-foreground">New to security testing</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-3">
            <RadioGroupItem value="intermediate" id="intermediate" />
            <Label htmlFor="intermediate" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Intermediate</p>
                <p className="text-sm text-muted-foreground">Some experience with security tools</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-3">
            <RadioGroupItem value="advanced" id="advanced" />
            <Label htmlFor="advanced" className="cursor-pointer flex-1">
              <div>
                <p className="font-medium">Advanced</p>
                <p className="text-sm text-muted-foreground">Experienced security professional</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

function GoalsStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  const handleGoalToggle = (goal: string, checked: boolean) => {
    const newGoals = checked
      ? [...data.goals, goal]
      : data.goals.filter(g => g !== goal);
    updateData({ goals: newGoals });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          What are your main goals? (Select all that apply)
        </Label>
        <div className="space-y-3">
          {goalOptions.map((goal) => (
            <div key={goal} className="flex items-center space-x-3 border rounded-lg p-3">
              <Checkbox
                id={goal}
                checked={data.goals.includes(goal)}
                onCheckedChange={(checked) => handleGoalToggle(goal, checked as boolean)}
              />
              <Label htmlFor={goal} className="cursor-pointer flex-1">
                {goal}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Let's create your first project</h3>
        <p className="text-muted-foreground mb-6">
          We'll set up a reconnaissance project to get you started. You can always create more projects later.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={data.projectName}
            onChange={(e) => updateData({ projectName: e.target.value })}
            placeholder="My First Reconnaissance Project"
            data-testid="input-project-name"
          />
        </div>

        <div>
          <Label htmlFor="target">Target Domain</Label>
          <Input
            id="target"
            value={data.target}
            onChange={(e) => updateData({ target: e.target.value })}
            placeholder="example.com"
            data-testid="input-target"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter the exact target domain (only this domain will be in scope)
          </p>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">What happens next?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• You'll define the exact scope and parameters</li>
          <li>• You can start with commands like "run basic recon on [your target]"</li>
          <li>• Our AI will help execute tools within your defined scope</li>
        </ul>
      </div>
    </div>
  );
}

function PlanStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Choose your plan</h3>
        <p className="text-muted-foreground">
          Start with our free plan and upgrade anytime for advanced features.
        </p>
      </div>

      <RadioGroup
        value={data.plan}
        onValueChange={(value: OnboardingData['plan']) => updateData({ plan: value })}
        className="space-y-4"
      >
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <RadioGroupItem value="free" id="free-plan" />
            <Label htmlFor="free-plan" className="font-medium">Free Plan</Label>
            <Badge variant="secondary">$0/month</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• Basic tools (subfinder, httpx, waybackurls)</div>
            <div>• 5 reconnaissance runs per day</div>
            <div>• Community support</div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <RadioGroupItem value="paid" id="paid-plan" />
            <Label htmlFor="paid-plan" className="font-medium">Pro Plan</Label>
            <Badge>$29/month</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• All reconnaissance tools</div>
            <div>• Unlimited runs and advanced AI models</div>
            <div>• Priority support and PDF exports</div>
          </div>
        </div>
      </RadioGroup>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="notifications"
          checked={data.notifications}
          onCheckedChange={(checked) => updateData({ notifications: checked as boolean })}
        />
        <Label htmlFor="notifications" className="text-sm">
          Send me updates about new features and security insights
        </Label>
      </div>
    </div>
  );
}

function CompleteStep({ data }: { data: OnboardingData }) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-4">You're all set!</h3>
        <p className="text-muted-foreground">
          Your project "{data.projectName}" is ready. We'll now create it and take you to the 
          chat interface where you can start your first reconnaissance.
        </p>
      </div>

      <div className="bg-muted p-4 rounded-lg text-left">
        <h4 className="font-medium mb-2">Quick start tips:</h4>
        <ul className="text-sm space-y-1">
          <li className="flex items-center space-x-2">
            <ChevronRight className="h-3 w-3" />
            <span>Try: "run basic recon on {data.target}"</span>
          </li>
          <li className="flex items-center space-x-2">
            <ChevronRight className="h-3 w-3" />
            <span>Ask: "find all subdomains"</span>
          </li>
          <li className="flex items-center space-x-2">
            <ChevronRight className="h-3 w-3" />
            <span>Request: "check for exposed endpoints"</span>
          </li>
        </ul>
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
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}