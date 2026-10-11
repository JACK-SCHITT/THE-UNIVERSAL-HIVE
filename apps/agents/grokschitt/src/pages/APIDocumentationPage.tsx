import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, Check, Book, Key, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function APIDocumentationPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'javascript' }: { code: string; id: string; language?: string }) => (
    <div className="relative group">
      <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm border border-border/50">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedId === id ? (
          <Check className="w-4 h-4 text-accent" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
            <p className="text-muted-foreground">Complete guide to GROKSCHITT v18 APIs</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="chat">Chat API</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="media">Media Generation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <p className="text-muted-foreground mb-6">
                GROKSCHITT v18 provides a comprehensive REST API for accessing all platform features including
                AI chat, fraud detection, image/video generation, and collaboration tools.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <Key className="w-8 h-8 mb-2 text-primary" />
                  <h3 className="font-bold mb-1">Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure JWT-based authentication with OnSpace Cloud
                  </p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <Zap className="w-8 h-8 mb-2 text-secondary" />
                  <h3 className="font-bold mb-1">Edge Functions</h3>
                  <p className="text-sm text-muted-foreground">
                    Serverless endpoints deployed on OnSpace Cloud
                  </p>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <Code className="w-8 h-8 mb-2 text-accent" />
                  <h3 className="font-bold mb-1">Rate Limits</h3>
                  <p className="text-sm text-muted-foreground">
                    1000 requests/hour for authenticated users
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-xl font-bold mb-4">Base URL</h3>
              <CodeBlock
                id="base-url"
                code="https://mdtpxtyyufetjvzamdtp.backend.onspace.ai/functions/v1"
              />
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card className="p-6 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-6">
                All API requests require authentication using a JWT token from OnSpace Cloud.
              </p>

              <h3 className="text-lg font-bold mb-3">Getting a Token</h3>
              <CodeBlock
                id="auth-js"
                code={`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mdtpxtyyufetjvzamdtp.backend.onspace.ai',
  'YOUR_ANON_KEY'
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const token = data.session.access_token;`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Using the Token</h3>
              <CodeBlock
                id="auth-curl"
                language="bash"
                code={`curl -X POST https://mdtpxtyyufetjvzamdtp.backend.onspace.ai/functions/v1/grok-chat \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello GROK-MAX!"}'`}
              />
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card className="p-6 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">GROK-MAX Chat API</h2>
              
              <h3 className="text-lg font-bold mb-3">Endpoint</h3>
              <CodeBlock
                id="chat-endpoint"
                code="POST /grok-chat"
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Request Body</h3>
              <CodeBlock
                id="chat-request"
                code={`{
  "conversationId": "uuid-string",
  "message": "Your message here",
  "model": "google/gemini-3-flash-preview",
  "systemPrompt": "Optional custom system prompt"
}`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">JavaScript Example</h3>
              <CodeBlock
                id="chat-js"
                code={`const { data, error } = await supabase.functions.invoke('grok-chat', {
  body: {
    conversationId: 'your-conversation-id',
    message: 'Tell me about quantum physics',
    model: 'google/gemini-3-flash-preview'
  }
});

console.log(data.response);`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Python Example</h3>
              <CodeBlock
                id="chat-python"
                language="python"
                code={`import requests

url = "https://mdtpxtyyufetjvzamdtp.backend.onspace.ai/functions/v1/grok-chat"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "conversationId": "your-conversation-id",
    "message": "Tell me about quantum physics",
    "model": "google/gemini-3-flash-preview"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}
              />
            </Card>
          </TabsContent>

          <TabsContent value="fraud" className="space-y-6">
            <Card className="p-6 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">Fraud Detection API</h2>
              
              <h3 className="text-lg font-bold mb-3">Endpoint</h3>
              <CodeBlock
                id="fraud-endpoint"
                code="POST /fraud-detect-rl"
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Request Body</h3>
              <CodeBlock
                id="fraud-request"
                code={`{
  "amount": 150.00,
  "merchantCategory": 5411,
  "timeHour": 14
}`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Response</h3>
              <CodeBlock
                id="fraud-response"
                code={`{
  "decision": "approve",
  "trustScore": 0.87,
  "deviation": 1.2,
  "reason": "Transaction within normal pattern"
}`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">cURL Example</h3>
              <CodeBlock
                id="fraud-curl"
                language="bash"
                code={`curl -X POST https://mdtpxtyyufetjvzamdtp.backend.onspace.ai/functions/v1/fraud-detect-rl \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 150.00,
    "merchantCategory": 5411,
    "timeHour": 14
  }'`}
              />
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="p-6 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">Image Generation API</h2>
              
              <h3 className="text-lg font-bold mb-3">Endpoint</h3>
              <CodeBlock
                id="image-endpoint"
                code="POST /generate-image"
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Request</h3>
              <CodeBlock
                id="image-request"
                code={`{
  "prompt": "A cyberpunk cityscape at night",
  "model": "black-forest-labs/flux-1.1-pro",
  "size": "1024x1024",
  "nsfw": false
}`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">JavaScript Example</h3>
              <CodeBlock
                id="image-js"
                code={`const { data, error } = await supabase.functions.invoke('generate-image', {
  body: {
    prompt: 'A cyberpunk cityscape at night',
    model: 'black-forest-labs/flux-1.1-pro',
    size: '1024x1024'
  }
});

console.log(data.imageUrl);`}
              />
            </Card>

            <Card className="p-6 bg-card/50">
              <h2 className="text-2xl font-bold mb-4">Video Generation API</h2>
              
              <h3 className="text-lg font-bold mb-3">Endpoint</h3>
              <CodeBlock
                id="video-endpoint"
                code="POST /generate-video"
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Request</h3>
              <CodeBlock
                id="video-request"
                code={`{
  "prompt": "A cat playing with a ball of yarn",
  "model": "google/veo-2",
  "duration": 5,
  "aspectRatio": "16:9"
}`}
              />

              <h3 className="text-lg font-bold mb-3 mt-6">Response</h3>
              <CodeBlock
                id="video-response"
                code={`{
  "videoUrl": "https://storage-url/video.mp4",
  "prompt": "A cat playing with a ball of yarn",
  "model": "google/veo-2"
}`}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
