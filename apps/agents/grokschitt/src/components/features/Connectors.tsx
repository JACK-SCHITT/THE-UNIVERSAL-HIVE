import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Gamepad2, Terminal, Globe, Database, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface Connection {
  id: string;
  type: string;
  name: string;
  status: 'connected' | 'disconnected';
}

const connectorTypes = [
  { id: 'app', name: 'App', subtitle: 'iOS/Android', icon: Smartphone, color: 'text-primary' },
  { id: 'game', name: 'Game', subtitle: 'Steam/Console', icon: Gamepad2, color: 'text-secondary' },
  { id: 'terminal', name: 'Terminal', subtitle: 'SSH/Bash', icon: Terminal, color: 'text-accent' },
  { id: 'website', name: 'Website', subtitle: 'Scrape/API', icon: Globe, color: 'text-primary' },
  { id: 'database', name: 'Database', subtitle: 'SQL/NoSQL', icon: Database, color: 'text-secondary' },
  { id: 'ai', name: 'AI/ML', subtitle: 'GPT/Claude', icon: Brain, color: 'text-accent' },
];

export default function Connectors() {
  const [connections, setConnections] = useState<Connection[]>([]);

  const connect = (type: string, name: string) => {
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      type,
      name,
      status: 'connected',
    };

    setConnections([...connections, newConnection]);
    toast.success(`Connected to ${name}`);
  };

  return (
    <div id="connect" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Globe className="w-10 h-10 text-accent" />
          Universal Connectors
        </h2>
        <p className="text-lg text-muted-foreground">
          Connect to any app, game, terminal, website, database, or AI.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {connectorTypes.map((connector) => {
          const Icon = connector.icon;
          return (
            <Card
              key={connector.id}
              className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => connect(connector.name, `${connector.name} Connection`)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-8 h-8 ${connector.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{connector.name}</h3>
                  <p className="text-sm text-muted-foreground">{connector.subtitle}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    connect(connector.name, `${connector.name} Connection`);
                  }}
                >
                  Connect
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-card/50 border-border/50 mt-8">
        <h3 className="text-xl font-semibold mb-4">Active Connections</h3>
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No active connections
          </p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="p-4 rounded-lg bg-background/70 border border-border flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{conn.name}</p>
                  <p className="text-xs text-muted-foreground">{conn.type} • {conn.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
                  <span className="text-sm text-accent font-medium">Connected</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
