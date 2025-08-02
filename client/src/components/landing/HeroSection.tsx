import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Zap, Target, Globe, Lock, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export function HeroSection() {
  const [domain, setDomain] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const prompts = [
    "run a basic recon on my scoped target",
    "pull down subdomains for target.com", 
    "gather all endpoints for target.com"
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const typeText = (text: string, index: number = 0) => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        timeout = setTimeout(() => typeText(text, index + 1), 100);
      } else {
        // Wait 2 seconds before starting to delete
        timeout = setTimeout(() => deleteText(text), 2000);
      }
    };

    const deleteText = (text: string, index: number = text.length) => {
      if (index >= 0) {
        setDisplayText(text.slice(0, index));
        timeout = setTimeout(() => deleteText(text, index - 1), 50);
      } else {
        // Move to next prompt and start typing
        setCurrentPrompt((prev) => (prev + 1) % prompts.length);
        timeout = setTimeout(() => typeText(prompts[(currentPrompt + 1) % prompts.length]), 500);
      }
    };

    typeText(prompts[currentPrompt]);

    return () => clearTimeout(timeout);
  }, [currentPrompt]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const handleDemoSearch = () => {
    if (domain) {
      // Navigate to project creation with the domain prefilled
      window.location.href = `/create-project?target=${encodeURIComponent(domain)}`;
    }
  };

  return (
    <section className="min-h-screen relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-mesh"></div>
        
        {/* Flowing lines background */}
        <div className="absolute inset-0 opacity-40">
          <svg className="absolute top-1/4 right-0 w-2/3 h-2/3" viewBox="0 0 800 600" fill="none">
            <path d="M400 100 Q600 200 400 300 Q200 400 400 500" stroke="url(#gradient1)" strokeWidth="2" fill="none" opacity="0.6"/>
            <path d="M450 120 Q650 220 450 320 Q250 420 450 520" stroke="url(#gradient1)" strokeWidth="1.5" fill="none" opacity="0.4"/>
            <path d="M350 80 Q550 180 350 280 Q150 380 350 480" stroke="url(#gradient1)" strokeWidth="1" fill="none" opacity="0.3"/>
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(210, 100%, 50%)" />
                <stop offset="100%" stopColor="hsl(210, 100%, 60%)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                Welcome.
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                AI-powered security reconnaissance that transforms hours of manual work into minutes of intelligent discovery
              </p>
            </div>

            {/* Main Search Input */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={`Ask ReconAI to ${displayText}${showCursor ? '|' : ' '}`}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 text-base rounded-full border-2 border-border focus:border-ring focus:ring-0 bg-card/50 backdrop-blur-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleDemoSearch()}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleDemoSearch} className="rounded-full px-6" data-testid="button-free-trial">
                  Free Trial
                </Button>
                <Button variant="outline" className="rounded-full px-6" onClick={() => window.location.href = '/onboarding'}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="relative">
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
              <div className="flex items-center space-x-3 mb-6">
                <Globe className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">Security Dashboard.</span>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Advanced reconnaissance capabilities powered by AI. Discover vulnerabilities, map attack surfaces, and generate comprehensive security reports with natural language commands.
              </p>
              
              {/* Feature icons */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Smart Targeting</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Live Monitoring</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Secure Reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}