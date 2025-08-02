import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";

export function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out reconnaissance capabilities",
      features: [
        "3 projects per month",
        "Basic subdomain discovery",
        "Essential reconnaissance tools",
        "Standard reports (PDF/HTML)",
        "Community support",
        "Basic findings database"
      ],
      limitations: [
        "Limited to 100 subdomains per scan",
        "No external API integrations",
        "No team collaboration",
        "Standard priority processing"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      description: "Advanced reconnaissance for security professionals",
      features: [
        "Unlimited projects",
        "All reconnaissance tools",
        "LLM-powered analysis",
        "External API integrations (Shodan, Censys)",
        "Professional reports with branding",
        "Priority processing",
        "Email support",
        "Advanced findings correlation",
        "Export to multiple formats",
        "30-day data retention"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Complete reconnaissance platform for teams",
      features: [
        "Everything in Professional",
        "Team collaboration & sharing",
        "Role-based access controls",
        "SOC2 compliance",
        "Custom integrations",
        "API access",
        "Dedicated support",
        "Custom retention policies",
        "Advanced audit logging",
        "SLA guarantees",
        "On-premise deployment options"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Reconnaissance Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and scale as your reconnaissance needs grow. All plans include core security features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-glow scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground ml-1">/month</span>}
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Limitations:</p>
                    <div className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="text-sm text-muted-foreground">
                          • {limitation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  asChild 
                  className={`w-full ${plan.popular ? 'shadow-glow' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link to="/auth">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include SSL encryption, GDPR compliance, and 99.9% uptime SLA.
          </p>
        </div>
      </div>
    </section>
  );
}