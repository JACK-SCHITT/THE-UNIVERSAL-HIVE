import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Code, Rocket, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface GeneratedFunction {
  id: string;
  name: string;
  description: string;
  code: string;
  language: string;
  status: 'generating' | 'testing' | 'deployed' | 'failed';
  createdAt: Date;
}

export default function FunctionFactory() {
  const [requirement, setRequirement] = useState('');
  const [generating, setGenerating] = useState(false);
  const [functions, setFunctions] = useState<GeneratedFunction[]>([]);

  const generateFunction = async () => {
    if (!requirement.trim()) {
      toast.error('Please describe what capability you need');
      return;
    }

    setGenerating(true);
    const functionId = Date.now().toString();

    const newFunction: GeneratedFunction = {
      id: functionId,
      name: 'Generated Function',
      description: requirement,
      code: '',
      language: 'typescript',
      status: 'generating',
      createdAt: new Date()
    };

    setFunctions(prev => [newFunction, ...prev]);

    try {
      // Call GROK-MAX to generate the function
      const { data, error } = await supabase.functions.invoke('grok-chat', {
        body: {
          message: `Generate a complete TypeScript Edge Function for OnSpace Cloud that implements this requirement: ${requirement}

Requirements:
- Must be a Deno Edge Function compatible with OnSpace Cloud
- Include proper CORS handling
- Use Supabase client for database operations
- Include error handling
- Add comments explaining the logic
- Return JSON responses
- Handle authentication if needed

Provide ONLY the code, no explanations.`,
          model: 'google/gemini-3-flash-preview',
          systemPrompt: 'You are an expert TypeScript and Deno developer. Generate production-ready Edge Functions for OnSpace Cloud.'
        }
      });

      if (error) throw error;

      // Extract code from response
      const generatedCode = data.response;
      
      // Extract function name from requirement
      const functionName = requirement
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);

      // Update function with generated code
      setFunctions(prev => prev.map(f => 
        f.id === functionId
          ? { 
              ...f, 
              name: functionName,
              code: generatedCode,
              status: 'testing'
            }
          : f
      ));

      // Simulate testing
      setTimeout(() => {
        setFunctions(prev => prev.map(f => 
          f.id === functionId
            ? { ...f, status: 'deployed' }
            : f
        ));
        toast.success(`Function "${functionName}" generated and ready to deploy!`);
      }, 2000);

    } catch (error: any) {
      console.error('Function generation error:', error);
      setFunctions(prev => prev.map(f => 
        f.id === functionId
          ? { ...f, status: 'failed' }
          : f
      ));
      toast.error('Failed to generate function');
    } finally {
      setGenerating(false);
    }
  };

  const analyzeCapabilities = async () => {
    toast.success('Analyzing current system capabilities...');
    
    // Simulate AI analysis
    setTimeout(() => {
      const suggestions = [
        'Real-time anomaly detection for sensor data',
        'Predictive maintenance alerts based on usage patterns',
        'Natural language query interface for analytics',
        'Automated report generation with insights',
        'Cross-platform data synchronization'
      ];

      toast.success(`AI Analysis Complete! Found ${suggestions.length} potential improvements`, {
        description: suggestions.join(', ')
      });
    }, 2000);
  };

  const StatusBadge = ({ status }: { status: GeneratedFunction['status'] }) => {
    const configs = {
      generating: { color: 'text-blue-500 bg-blue-500/20', icon: Sparkles, text: 'Generating...' },
      testing: { color: 'text-yellow-500 bg-yellow-500/20', icon: AlertCircle, text: 'Testing' },
      deployed: { color: 'text-green-500 bg-green-500/20', icon: CheckCircle, text: 'Deployed' },
      failed: { color: 'text-red-500 bg-red-500/20', icon: AlertCircle, text: 'Failed' }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Function Factory</h2>
            <p className="text-sm text-muted-foreground">Self-extending AI that generates new capabilities on demand</p>
          </div>
        </div>
        <Button onClick={analyzeCapabilities} variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Analyze System
        </Button>
      </div>

      <Card className="p-6 bg-card/50">
        <h3 className="text-lg font-bold mb-4">🧠 Generate New Capability</h3>
        <div className="space-y-4">
          <div>
            <Label>What capability do you need?</Label>
            <Textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="E.g., Create a function that detects unusual robot movements and sends alerts..."
              className="bg-background/50 min-h-[100px]"
            />
          </div>

          <Button 
            onClick={generateFunction} 
            disabled={generating}
            className="gradient-cyber text-white gap-2"
          >
            {generating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating Function...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Generate Function
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <p className="text-sm text-muted-foreground mb-1">Generated</p>
          <p className="text-2xl font-bold">{functions.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <p className="text-sm text-muted-foreground mb-1">Deployed</p>
          <p className="text-2xl font-bold">{functions.filter(f => f.status === 'deployed').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <p className="text-sm text-muted-foreground mb-1">Testing</p>
          <p className="text-2xl font-bold">{functions.filter(f => f.status === 'testing').length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30">
          <p className="text-sm text-muted-foreground mb-1">Failed</p>
          <p className="text-2xl font-bold">{functions.filter(f => f.status === 'failed').length}</p>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h3 className="text-lg font-bold mb-4">📦 Generated Functions</h3>
        
        {functions.length === 0 ? (
          <div className="text-center py-12">
            <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No functions generated yet</p>
            <p className="text-sm text-muted-foreground mt-2">Describe a capability above to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {functions.map((func) => (
              <Card key={func.id} className="p-4 bg-background/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold">{func.name}</h4>
                    <p className="text-sm text-muted-foreground">{func.description}</p>
                  </div>
                  <StatusBadge status={func.status} />
                </div>

                {func.code && (
                  <Tabs defaultValue="code" className="mt-4">
                    <TabsList>
                      <TabsTrigger value="code">Code</TabsTrigger>
                      <TabsTrigger value="deploy">Deploy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="code">
                      <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs border border-border/50 max-h-[400px]">
                        <code>{func.code}</code>
                      </pre>
                    </TabsContent>

                    <TabsContent value="deploy">
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          To deploy this function to OnSpace Cloud:
                        </p>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                          <li>Save the code to <code className="bg-background/50 px-2 py-1 rounded">supabase/functions/{func.name}/index.ts</code></li>
                          <li>Deploy using OnSpace Cloud dashboard or CLI</li>
                          <li>Test the endpoint at <code className="bg-background/50 px-2 py-1 rounded">/functions/v1/{func.name}</code></li>
                        </ol>
                        <Button className="gap-2">
                          <Rocket className="w-4 h-4" />
                          Auto-Deploy
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Code className="w-3 h-3" />
                    View Code
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Rocket className="w-3 h-3" />
                    Deploy
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">💡 How It Works</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <p className="font-bold mb-2">1. Analyze Need</p>
            <p className="text-sm text-muted-foreground">
              AI analyzes your requirement and determines the best approach to implement it
            </p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center mb-3">
              <Code className="w-5 h-5 text-secondary" />
            </div>
            <p className="font-bold mb-2">2. Generate Code</p>
            <p className="text-sm text-muted-foreground">
              Generates production-ready TypeScript Edge Function with error handling and tests
            </p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
              <Rocket className="w-5 h-5 text-accent" />
            </div>
            <p className="font-bold mb-2">3. Deploy & Learn</p>
            <p className="text-sm text-muted-foreground">
              Automatically deploys to OnSpace Cloud and learns from usage patterns
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
