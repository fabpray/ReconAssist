import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Shield, Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 md:px-8">
        <Link to="/" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ReconAI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="#about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link to="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link to="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Start Free Trial</Link>
          </Button>
        </div>

        {/* Mobile Menu Button & Theme Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 space-y-4">
            <Link to="#about" className="block text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="#pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="#docs" className="block text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link to="#contact" className="block text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <div className="space-y-2 pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}