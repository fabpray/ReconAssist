import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  FolderOpen,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  // Mock data for demonstration
  const recentProjects = [
    {
      id: 1,
      name: "example.com Security Assessment",
      status: "completed",
      findings: 42,
      severity: "high",
      lastRun: "2 hours ago"
    },
    {
      id: 2,
      name: "subdomain.target.org",
      status: "running",
      findings: 18,
      severity: "medium",
      lastRun: "Running now"
    },
    {
      id: 3,
      name: "Internal App Recon",
      status: "pending",
      findings: 0,
      severity: "low",
      lastRun: "Queued"
    }
  ];

  const stats = [
    {
      title: "Active Projects",
      value: "12",
      icon: FolderOpen,
      change: "+2 this week"
    },
    {
      title: "Total Findings",
      value: "284",
      icon: Search,
      change: "+47 this week"
    },
    {
      title: "Critical Issues",
      value: "8",
      icon: AlertTriangle,
      change: "-3 resolved"
    },
    {
      title: "Scans This Month",
      value: "156",
      icon: TrendingUp,
      change: "+23% from last month"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "running":
        return <Activity className="h-4 w-4 text-primary animate-pulse" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      high: "destructive",
      medium: "outline", 
      low: "secondary"
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || "secondary"}>
        {severity}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your reconnaissance projects and findings</p>
          </div>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Projects
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Your latest reconnaissance projects and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(project.status)}
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.findings} findings • Last run: {project.lastRun}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(project.severity)}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/projects/${project.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Get started with reconnaissance in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start">
                <Link to="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/templates">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Browse Templates
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest reconnaissance activity across your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Subdomain scan completed</span>
                  <span className="text-muted-foreground">2h ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>New critical finding detected</span>
                  <span className="text-muted-foreground">4h ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Report generated and exported</span>
                  <span className="text-muted-foreground">1d ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}