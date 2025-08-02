import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DecisionLoop } from '../backend/services/decision-loop';
import { LLMClient } from '../backend/services/llm-client';
import { ProjectManager } from '../backend/services/project-manager';
import { ToolRunner } from '../backend/services/tool-runner';
import { KeyManager } from '../backend/services/key-manager';
import { ThreatIntelligenceEngine } from '../backend/services/threat-intelligence';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const llmClient = new LLMClient();
  const decisionLoop = new DecisionLoop(llmClient);
  const projectManager = new ProjectManager();
  const toolRunner = new ToolRunner();
  const keyManager = new KeyManager();
  const threatEngine = new ThreatIntelligenceEngine();

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, plan = 'free' } = req.body;
      const user = await storage.createUser({ username, password, plan });
      res.json({ success: true, user: { id: user.id, username: user.username, plan: user.plan } });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ success: true, user: { id: user.id, username: user.username, plan: user.plan } });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Project routes
  app.post('/api/projects', async (req, res) => {
    try {
      const { name, target, scope, user_id, plan = 'free' } = req.body;
      const project = await projectManager.createProject(user_id, name, target, scope, plan);
      res.json({ success: true, project });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await projectManager.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ project });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/users/:userId/projects', async (req, res) => {
    try {
      const projects = await projectManager.getUserProjects(req.params.userId);
      res.json({ projects });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/projects/:id/scope', async (req, res) => {
    try {
      const { scope, plan = 'free' } = req.body;
      await projectManager.updateProjectScope(req.params.id, scope, plan);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Decision loop and chat routes
  app.post('/api/projects/:id/chat', async (req, res) => {
    try {
      const { message, user_id } = req.body;
      const decision = await decisionLoop.processUserInput(req.params.id, message, user_id);
      res.json({ decision });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Tool execution routes
  app.post('/api/projects/:id/tools/execute', async (req, res) => {
    try {
      const { tool, target, user_plan = 'free', api_keys = {}, headers = {} } = req.body;
      const result = await toolRunner.executeTool(tool, target, req.params.id, user_plan, api_keys, headers);
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/tools', async (req, res) => {
    try {
      const { user_plan = 'free', user_keys = [] } = req.query;
      const tools = toolRunner.getAvailableTools(user_plan as 'free' | 'paid', user_keys as string[]);
      res.json({ tools });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // API key management routes
  app.post('/api/users/:userId/keys', async (req, res) => {
    try {
      const { service, api_key } = req.body;
      const keyRecord = await keyManager.storeApiKey(parseInt(req.params.userId), service, api_key);
      res.json({ success: true, key: { id: keyRecord.id, service: keyRecord.service, is_valid: keyRecord.is_valid } });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/users/:userId/keys', async (req, res) => {
    try {
      const keys = await keyManager.getUserApiKeys(parseInt(req.params.userId));
      const safeKeys = keys.map(key => ({ 
        id: key.id, 
        service: key.service, 
        is_valid: key.is_valid,
        last_validated: key.last_validated 
      }));
      res.json({ keys: safeKeys });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/users/:userId/keys/:service', async (req, res) => {
    try {
      await keyManager.deleteApiKey(parseInt(req.params.userId), req.params.service);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/keys/validate', async (req, res) => {
    try {
      const { service, api_key } = req.body;
      const validation = await keyManager.validateApiKey(service, api_key);
      res.json({ validation });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Threat intelligence routes
  app.get('/api/projects/:id/threats', async (req, res) => {
    try {
      // Mock findings for now - TODO: integrate with actual findings
      const mockFindings = [
        {
          id: 'finding_1',
          title: 'Admin Panel Exposed',
          description: 'Administrative interface accessible without authentication',
          severity: 'critical',
          type: 'endpoint',
          created_at: new Date().toISOString()
        }
      ];
      
      const predictions = await threatEngine.analyzeFindings(req.params.id, mockFindings);
      const project = await projectManager.getProject(req.params.id);
      
      if (project) {
        const assessment = await threatEngine.generateRiskAssessment(project, mockFindings, predictions);
        res.json({ assessment });
      } else {
        res.status(404).json({ error: 'Project not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Feedback routes
  app.post('/api/projects/:id/feedback', async (req, res) => {
    try {
      const { target_id, target_type, feedback_type, content } = req.body;
      // TODO: Store feedback in database
      res.json({ success: true, feedback_id: `feedback_${Date.now()}` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Override routes
  app.post('/api/projects/:id/overrides', async (req, res) => {
    try {
      const { content } = req.body;
      // TODO: Store override in database
      res.json({ success: true, override_id: `override_${Date.now()}` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/projects/:id/overrides', async (req, res) => {
    try {
      // TODO: Fetch from database
      res.json({ overrides: [] });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Metrics and usage routes
  app.get('/api/projects/:id/metrics', async (req, res) => {
    try {
      // TODO: Calculate actual metrics from database
      const metrics = {
        api_calls: 45,
        simulated_fallbacks: 12,
        llm_tokens_used: 2345,
        tools_executed: 8,
        recon_score: 72,
        findings_count: {
          critical: 2,
          high: 5,
          medium: 12,
          low: 18
        }
      };
      res.json({ metrics });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Demo mode route for unauthenticated users
  app.get('/api/demo/project', async (req, res) => {
    try {
      const demoProject = {
        id: 'demo_project',
        name: 'Demo Security Assessment',
        target: 'example.com',
        scope: ['example.com'],
        status: 'active',
        plan: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.json({ project: demoProject });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
