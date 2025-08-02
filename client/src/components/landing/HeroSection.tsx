import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Zap, Target } from "lucide-react";
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
      // For now, just redirect to auth. Later we'll add demo mode
      window.location.href = "/auth";
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            ReconAI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light">
            AI-powered security reconnaissance that transforms hours of manual work into minutes of intelligent discovery
          </p>
        </div>

        {/* Main Search Input */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Input
              placeholder={`Ask ReconAI to ${displayText}${showCursor ? '|' : ' '}`}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full h-14 px-6 text-lg rounded-xl border-2 border-border focus:border-ring focus:ring-0 bg-background shadow-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleDemoSearch()}
            />
            <Button 
              onClick={handleDemoSearch} 
              className="absolute right-2 top-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary/90"
            >
              Submit
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3 font-light">
            Free to try • No signup required
          </p>
        </div>

        {/* Simple Feature List */}
        <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Smart Scoping</h3>
            <p className="text-muted-foreground text-sm">
              Define targets with natural language
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Auto Discovery</h3>
            <p className="text-muted-foreground text-sm">
              20+ tools orchestrated by AI
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Intelligent Analysis</h3>
            <p className="text-muted-foreground text-sm">
              AI-powered insights and reporting
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16">
          <Button asChild size="lg" variant="outline" className="rounded-xl px-8">
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}