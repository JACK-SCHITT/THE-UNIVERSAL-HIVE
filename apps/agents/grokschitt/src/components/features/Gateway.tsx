import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radio, Layers, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  name: string;
  status: 'active' | 'idle';
  channels: number;
  created: string;
}

export default function Gateway() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [activeTab, setActiveTab] = useState<'status' | 'sessions' | 'channels'>('status');
  const [logs, setLogs] = useState<string[]>([
    '$ GROKSCHITT Gateway v18.0.0',
    '$ WebSocket: ws://127.0.0.1:18789',
    '$ Core Values: NEVER LEAVE A FRIEND BEHIND, SECRETS DON\'T MAKE FRIENDS',
    '$ Gateway ready...',
  ]);

  const createSession = () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: sessionName,
      status: 'active',
      channels: 0,
      created: new Date().toLocaleTimeString(),
    };

    setSessions([...sessions, newSession]);
    setLogs([...logs, `$ Created session: ${sessionName} (${newSession.id})`]);
    setSessionName('');
    toast.success(`Session "${sessionName}" created`);
  };

  return (
    <div id="gateway" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Radio className="w-10 h-10 text-secondary" />
          WebSocket Gateway
        </h2>
        <p className="text-lg text-muted-foreground">
          Central control plane for sessions, channels, tools, and events.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Active Sessions</span>
            <Radio className="w-5 h-5 text-primary" />
          </div>
          <p className="text-4xl font-bold text-primary">{sessions.length}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Connected Channels</span>
            <Layers className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-4xl font-bold text-secondary">
            {sessions.reduce((acc, s) => acc + s.channels, 0)}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Available Tools</span>
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <p className="text-4xl font-bold text-accent">12</p>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-6">Gateway Console</h3>

        <div className="flex gap-2 mb-6 border-b border-border">
          {(['status', 'sessions', 'channels'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background/70 font-mono text-sm space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="text-accent">
                  {log}
                  {i === logs.length - 1 && <span className="animate-pulse">_</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Session name..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createSession()}
                className="bg-background/50"
              />
              <Button onClick={createSession} className="gradient-cyber text-white">
                Create Session
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Active Sessions</h4>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No active sessions</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-lg bg-background/70 border border-border flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">{session.name}</p>
                        <p className="text-xs text-muted-foreground">{session.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
                          <span className="text-xs text-accent font-medium">Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Created: {session.created}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="py-8 text-center text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No channels connected</p>
            <p className="text-xs mt-2">Create a session to establish channels</p>
          </div>
        )}
      </Card>
    </div>
  );
}
