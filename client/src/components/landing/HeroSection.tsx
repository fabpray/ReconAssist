import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Zap, Target } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export function HeroSection() {
  const [domain, setDomain] = useState("");

  const handleDemoSearch = () => {
    if (domain) {
      // For now, just redirect to auth. Later we'll add demo mode
      window.location.href = "/auth";
    }
  };

  return (
    <section className="relative py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            AI-Powered Reconnaissance Platform
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Automate your security reconnaissance with intelligent LLM-guided discovery. 
            From scope definition to actionable insights in minutes, not hours.
          </p>

          {/* Domain Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-background rounded-lg shadow-elegant border">
              <div className="flex-1 flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground ml-3" />
                <Input
                  placeholder="Enter domain to analyze (e.g., example.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="border-0 focus-visible:ring-0 bg-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleDemoSearch()}
                />
              </div>
              <Button onClick={handleDemoSearch} className="whitespace-nowrap">
                Start Recon
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Try it free • No credit card required
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Scoping</h3>
              <p className="text-muted-foreground">
                Define reconnaissance scope with natural language and safety controls
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Automated Discovery</h3>
              <p className="text-muted-foreground">
                20+ reconnaissance tools orchestrated by AI for comprehensive coverage
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Intelligent Analysis</h3>
              <p className="text-muted-foreground">
                LLM-powered risk assessment and actionable security insights
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="shadow-glow">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="#demo">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}