import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DecisionLoop } from '../backend/services/decision-loop';
import { LLMClient } from '../backend/services/llm-client';
import { ProjectManager } from '../backend/services/project-manager';
import { ToolRunner } from '../backend/services/tool-runner';
import { KeyManager } from '../backend/services/key-manager';
import { ThreatIntelligenceEngine } from '../backend/services/threat-intelligence';

// Helper function for error handling
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

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
      res.status(400).json({ error: getErrorMessage(error) });
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
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // Project routes
  app.post('/api/projects', async (req, res) => {
    try {
      const { name, target, scope, user_id, plan = 'free' } = req.body;
      const project = await projectManager.createProject(user_id, name, target, scope, plan);
      res.json({ success: true, project });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
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
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.get('/api/users/:userId/projects', async (req, res) => {
    try {
      const projects = await projectManager.getUserProjects(req.params.userId);
      res.json({ projects });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.put('/api/projects/:id/scope', async (req, res) => {
    try {
      const { scope, plan = 'free' } = req.body;
      await projectManager.updateProjectScope(req.params.id, scope, plan);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // Decision loop and chat routes
  app.post('/api/projects/:id/chat', async (req, res) => {
    try {
      const { message, user_id } = req.body;
      const decision = await decisionLoop.processUserInput(req.params.id, message, user_id);
      res.json({ decision });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // Streaming chat interface for real-time responses
  app.post('/api/projects/:id/chat/stream', async (req, res) => {
    try {
      const { message, user_id } = req.body;
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send analysis phase
      res.write(`data: ${JSON.stringify({ type: 'analysis', content: 'Analyzing your request...' })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Process with AI
      const decision = await decisionLoop.processUserInput(req.params.id, message, user_id);
      
      // Generate conversational response based on the decision
      let response = '';
      if (decision.actions && decision.actions.length > 0) {
        response = `I'll help you with reconnaissance on your target. Based on your request "${message}", I'm going to start by running ${decision.actions.map(a => a.tool).join(' and ')} to gather intelligence about ${decision.actions[0].target}.\n\nHere's my analysis: ${decision.reasoning}`;
      } else {
        // For conversational messages without actions, just use the reasoning directly
        response = decision.reasoning;
      }

      // Stream the response word by word
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words.slice(0, i + 1).join(' ');
        res.write(`data: ${JSON.stringify({ type: 'response', content: chunk })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Send the actions for UI interaction
      if (decision.actions && decision.actions.length > 0) {
        res.write(`data: ${JSON.stringify({ 
          type: 'actions', 
          actions: decision.actions,
          reasoning: decision.reasoning,
          confidence: decision.confidence 
        })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: getErrorMessage(error) })}\n\n`);
      res.end();
    }
  });

  // Tool execution routes
  app.post('/api/projects/:id/tools/execute', async (req, res) => {
    try {
      const { tool, target, user_plan = 'free', api_keys = {}, headers = {} } = req.body;
      const result = await toolRunner.executeTool(tool, target, req.params.id, user_plan, api_keys, headers);
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.get('/api/tools', async (req, res) => {
    try {
      const { user_plan = 'free', user_keys = [] } = req.query;
      const tools = toolRunner.getAvailableTools(user_plan as 'free' | 'paid', user_keys as string[]);
      res.json({ tools });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // API key management routes
  app.post('/api/users/:userId/keys', async (req, res) => {
    try {
      const { service, api_key } = req.body;
      const keyRecord = await keyManager.storeApiKey(parseInt(req.params.userId), service, api_key);
      res.json({ success: true, key: { id: keyRecord.id, service: keyRecord.service, is_valid: keyRecord.is_valid } });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
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
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.delete('/api/users/:userId/keys/:service', async (req, res) => {
    try {
      await keyManager.deleteApiKey(parseInt(req.params.userId), req.params.service);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.post('/api/keys/validate', async (req, res) => {
    try {
      const { service, api_key } = req.body;
      const validation = await keyManager.validateApiKey(service, api_key);
      res.json({ validation });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
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
      
      const threats = threatEngine.assessThreats(mockFindings);
      res.json({ threats });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // Metrics routes
  app.get('/api/projects/:id/metrics', async (req, res) => {
    try {
      const metrics = await projectManager.getProjectMetrics(req.params.id);
      res.json({ metrics });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.get('/api/users/:userId/metrics', async (req, res) => {
    try {
      const metrics = await projectManager.getUserMetrics(req.params.userId);
      res.json({ metrics });
    } catch (error) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}