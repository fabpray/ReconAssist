import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Search, 
  Shield, 
  Zap, 
  Globe, 
  FileText, 
  Users, 
  Lock,
  Activity,
  Target,
  Database,
  Cpu
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "LLM-Guided Reconnaissance",
      description: "Advanced AI models analyze findings, assess risk levels, and suggest next steps for maximum impact.",
      badge: "AI-Powered"
    },
    {
      icon: Search,
      title: "20+ Reconnaissance Tools",
      description: "Integrated subdomain discovery, endpoint enumeration, JavaScript analysis, and vulnerability scanning.",
      badge: "Comprehensive"
    },
    {
      icon: Target,
      title: "Smart Scope Management",
      description: "Define targets with natural language. Built-in safety controls prevent accidental out-of-scope testing.",
      badge: "Safe"
    },
    {
      icon: Globe,
      title: "External Intelligence",
      description: "Enrich findings with Shodan, Censys, SecurityTrails, and VirusTotal for complete asset visibility.",
      badge: "Enriched"
    },
    {
      icon: FileText,
      title: "Professional Reports",
      description: "Generate executive summaries, technical reports, and custom deliverables with your branding.",
      badge: "Professional"
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Watch reconnaissance progress live with detailed execution logs and status updates.",
      badge: "Live"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share projects, findings, and reports with team members. Role-based access controls included.",
      badge: "Pro"
    },
    {
      icon: Lock,
      title: "Secure by Design",
      description: "Encrypted API storage, audit logging, and SOC2-compliant infrastructure for enterprise security.",
      badge: "Enterprise"
    },
    {
      icon: Database,
      title: "Findings Database",
      description: "Centralized storage for all discoveries with advanced search, filtering, and correlation capabilities.",
      badge: "Organized"
    },
    {
      icon: Cpu,
      title: "API Integration",
      description: "RESTful API for integrating reconnaissance into your existing security workflows and CI/CD pipelines.",
      badge: "Developer"
    }
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for Modern Reconnaissance
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From automated discovery to intelligent analysis, our platform handles every aspect 
            of security reconnaissance with enterprise-grade security and reliability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary">{feature.badge}</Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}