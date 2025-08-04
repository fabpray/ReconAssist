import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ThumbsUp, ThumbsDown, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionCard as ActionCardType } from '@shared/types';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ActionCardType[];
  isStreaming?: boolean;
  analysis?: string;
}

interface StreamingChatInterfaceProps {
  projectId: string;
  projectName: string;
  target: string;
}

export function StreamingChatInterface({ projectId, projectName, target }: StreamingChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: `Welcome to ${projectName}! I'm your AI reconnaissance assistant, ready to help you discover intelligence about ${target}. Try asking me to "run basic recon" or specify what you'd like to discover.`,
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
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Create initial assistant message that will be updated as we stream
    const assistantMessageId = `msg_${Date.now()}_assistant`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      analysis: ''
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Use streaming endpoint
      const response = await fetch(`/api/projects/${projectId}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          user_id: '1'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'analysis') {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, analysis: data.content }
                    : msg
                ));
              } else if (data.type === 'response') {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: data.content, analysis: '' }
                    : msg
                ));
              } else if (data.type === 'actions') {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, actions: data.actions }
                    : msg
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: 'Sorry, I encountered an error. Please try again.',
              isStreaming: false,
              analysis: ''
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: ActionCardType) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tools/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: action.tool,
          target: action.target,
          user_plan: 'free'
        })
      });

      const data = await response.json();
      
      const resultMessage: Message = {
        id: `msg_${Date.now()}_result`,
        type: 'system',
        content: `✅ ${action.tool} completed successfully! Found ${data.result?.output?.length || 0} results for ${action.target}.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      console.error('Tool execution error:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        type: 'system',
        content: `❌ Failed to execute ${action.tool}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-6 w-6" />;
      case 'assistant': return <Bot className="h-6 w-6" />;
      default: return <Bot className="h-6 w-6" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.type !== 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {getMessageIcon(message.type)}
              </div>
            )}
            
            <div className={`flex flex-col max-w-[80%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-lg px-4 py-2 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.type === 'system'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {/* Show analysis phase */}
                {message.analysis && (
                  <div className="text-sm text-muted-foreground italic mb-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {message.analysis}
                  </div>
                )}
                
                {/* Main content */}
                <div className="whitespace-pre-wrap">
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                  )}
                </div>
              </div>

              {/* Action Cards */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2 w-full">
                  {message.actions.map((action, index) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {action.tool}
                              </Badge>
                              <span className="text-sm font-medium">{action.target}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{action.reason}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Confidence: {Math.round(action.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleExecuteAction(action)}
                              className="flex items-center gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Execute
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                {getMessageIcon(message.type)}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to run reconnaissance tools..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}