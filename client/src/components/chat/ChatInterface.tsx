import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ThumbsUp, ThumbsDown, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionCard as ActionCardType } from '../../../shared/types.js';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ActionCardType[];
  reasoning?: string;
  clarification?: string;
}

interface ChatInterfaceProps {
  projectId: string;
  projectName: string;
  target: string;
}

export function ChatInterface({ projectId, projectName, target }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: `Welcome to ${projectName}! I'm ready to help you with reconnaissance on ${target}. Try asking me to "run basic recon" or specify what you'd like to discover.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to backend decision loop
      const response = await simulateDecisionLoop(input, projectId);
      
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        type: 'assistant',
        content: response.clarification || 'Here are my suggested actions:',
        timestamp: new Date(),
        actions: response.clarification ? undefined : response.actions,
        reasoning: response.reasoning,
        clarification: response.clarification
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        type: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAction = async (actionId: string) => {
    // TODO: Implement action acceptance and queueing
    console.log('Accepting action:', actionId);
    
    // Update action status in the message
    setMessages(prev => prev.map(msg => ({
      ...msg,
      actions: msg.actions?.map(action => 
        action.id === actionId 
          ? { ...action, status: 'running' as const }
          : action
      )
    })));

    // TODO: Call backend to enqueue action
  };

  const handleRejectAction = (actionId: string) => {
    setMessages(prev => prev.map(msg => ({
      ...msg,
      actions: msg.actions?.map(action => 
        action.id === actionId 
          ? { ...action, status: 'rejected' as const }
          : action
      )
    })));
  };

  const handleFeedback = (messageId: string, type: 'thumbs_up' | 'thumbs_down') => {
    // TODO: Send feedback to backend
    console.log('Feedback:', { messageId, type });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div>
          <h2 className="text-lg font-semibold">{projectName}</h2>
          <p className="text-sm text-muted-foreground">Target: {target}</p>
        </div>
        <Badge variant="outline">Active</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onAcceptAction={handleAcceptAction}
            onRejectAction={handleRejectAction}
            onFeedback={handleFeedback}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing request...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to run reconnaissance..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Try: "run basic recon", "find endpoints", "check for secrets"
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  onAcceptAction, 
  onRejectAction, 
  onFeedback 
}: {
  message: Message;
  onAcceptAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
  onFeedback: (messageId: string, type: 'thumbs_up' | 'thumbs_down') => void;
}) {
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex space-x-2 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : message.type === 'system'
            ? 'bg-muted text-muted-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}>
          {message.type === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <div className={`rounded-lg p-3 ${
            message.type === 'user' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-card border border-border'
          }`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
            
            {message.reasoning && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-sm opacity-75">
                  <strong>Reasoning:</strong> {message.reasoning}
                </p>
              </div>
            )}
          </div>

          {/* Action Cards */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onAccept={() => onAcceptAction(action.id)}
                  onReject={() => onRejectAction(action.id)}
                />
              ))}
            </div>
          )}

          {/* Feedback buttons */}
          {message.type === 'assistant' && (
            <div className="flex items-center space-x-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback(message.id, 'thumbs_up')}
                data-testid={`button-thumbs-up-${message.id}`}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback(message.id, 'thumbs_down')}
                data-testid={`button-thumbs-down-${message.id}`}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ 
  action, 
  onAccept, 
  onReject 
}: {
  action: ActionCardType;
  onAccept: () => void;
  onReject: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suggested': return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'accepted': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'running': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'completed': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'rejected': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      default: return 'bg-card border-border';
    }
  };

  return (
    <Card className={`${getStatusColor(action.status)} transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{action.tool}</Badge>
            {action.inferred && <Badge variant="outline">Inferred</Badge>}
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>{Math.round(action.confidence * 100)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="font-medium">Target: {action.target}</p>
          <p className="text-sm text-muted-foreground">{action.reason}</p>
          
          {action.status === 'suggested' && (
            <div className="flex space-x-2 pt-2">
              <Button 
                size="sm" 
                onClick={onAccept}
                data-testid={`button-accept-${action.id}`}
              >
                <Play className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReject}
                data-testid={`button-reject-${action.id}`}
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
          
          {action.status === 'running' && (
            <div className="flex items-center space-x-2 pt-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">Running...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Temporary simulation function - replace with actual API call
async function simulateDecisionLoop(input: string, projectId: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('basic recon') || lowerInput.includes('start')) {
    return {
      actions: [
        {
          id: `action_${Date.now()}_1`,
          tool: 'subfinder',
          target: 'example.com',
          reason: 'Enumerate subdomains to discover the attack surface',
          confidence: 0.9,
          inferred: false,
          status: 'suggested' as const
        },
        {
          id: `action_${Date.now()}_2`,
          tool: 'httpx',
          target: 'discovered_subdomains',
          reason: 'Check which discovered subdomains are live and accessible',
          confidence: 0.8,
          inferred: true,
          status: 'suggested' as const
        }
      ],
      reasoning: 'Starting with subdomain enumeration is the standard first step in reconnaissance. This will help us understand the target\'s infrastructure before proceeding with deeper analysis.'
    };
  }

  if (lowerInput.includes('endpoints') || lowerInput.includes('urls')) {
    return {
      actions: [
        {
          id: `action_${Date.now()}_1`,
          tool: 'waybackurls',
          target: 'example.com',
          reason: 'Gather historical URLs from Wayback Machine',
          confidence: 0.7,
          inferred: false,
          status: 'suggested' as const
        }
      ],
      reasoning: 'URL collection helps identify potential endpoints and attack vectors that might not be discoverable through traditional crawling.'
    };
  }

  return {
    clarification: 'Could you please specify what type of reconnaissance you\'d like to perform? For example: "run basic recon", "find endpoints", "check for vulnerabilities", etc.'
  };
}