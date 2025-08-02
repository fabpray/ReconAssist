// Shared types for ReconAI application

export interface User {
  id: string;
  email: string;
  plan: 'free' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  target: string;
  scope: string[];
  status: 'active' | 'paused' | 'completed';
  plan: 'free' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface ProjectTool {
  id: string;
  project_id: string;
  tool_name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface ProjectHeader {
  id: string;
  project_id: string;
  name: string;
  value: string;
  enabled: boolean;
}

export interface Run {
  id: string;
  project_id: string;
  tool_name: string;
  target: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Finding {
  id: string;
  project_id: string;
  run_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  target: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  type: 'user' | 'llm_decision' | 'tool' | 'override';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Feedback {
  id: string;
  message_id: string;
  type: 'thumbs_up' | 'thumbs_down' | 'override' | 'correction';
  content?: string;
  created_at: string;
}

export interface ActionCard {
  id: string;
  tool: string;
  target: string;
  reason: string;
  confidence: number;
  inferred: boolean;
  status: 'suggested' | 'accepted' | 'rejected' | 'running' | 'completed';
}

export interface ReconScore {
  total_score: number;
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  top_findings: Finding[];
}

// Tool interfaces
export interface ToolConfig {
  name: string;
  enabled: boolean;
  free_tier: boolean;
  description: string;
  inputs: string[];
  outputs: string[];
}

export interface ToolResult {
  success: boolean;
  data: any;
  error?: string;
  execution_time: number;
}

// LLM Decision types
export interface LLMDecision {
  actions: ActionCard[];
  reasoning: string;
  confidence: number;
  clarification?: string;
}

export interface ContextItem {
  type: 'message' | 'finding' | 'override';
  content: string;
  relevance_score: number;
  timestamp: string;
}

// Threat Intelligence types
export interface ThreatPrediction {
  id: string;
  project_id: string;
  threat_type: string;
  risk_score: number;
  confidence: number;
  predicted_attack_vectors: string[];
  recommended_actions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  impact: number;
  created_at: string;
}

export interface RiskAssessment {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  primary_threats: ThreatPrediction[];
  vulnerability_trends: {
    increasing: string[];
    decreasing: string[];
    stable: string[];
  };
  attack_surface_analysis: {
    exposed_services: number;
    critical_endpoints: number;
    weak_configurations: number;
    data_exposure_risk: number;
  };
  time_to_compromise_estimate: string;
  recommendations: string[];
}