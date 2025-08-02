import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Link } from "wouter";

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ReconAssistant</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your reconnaissance dashboard
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Authentication system will be implemented in Phase 1
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This is a placeholder for the authentication system that will include:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Email/password signup and login</li>
                <li>• Email verification</li>
                <li>• User profile management</li>
                <li>• Plan tier tracking</li>
                <li>• Protected routes</li>
              </ul>
              
              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link to="/dashboard">Continue to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}