import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Terminal as TerminalIcon, Search, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export default function KimiClaw() {
  const [command, setCommand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([
    '$ KIMI Claw v0.11.0',
    '$ Bot Token: sk-***SE2',
    '$ Tools: upload, shell, search',
    '$ Connected and ready',
  ]);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const newLog = `$ Uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        setLogs([...logs, newLog]);
        toast.success(`File "${file.name}" uploaded to KIMI`);
      }
    };
    input.click();
  };

  const executeCommand = () => {
    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }

    const newLogs = [
      ...logs,
      `$ ${command}`,
      `> Executing command...`,
      `> Command completed successfully`,
    ];
    setLogs(newLogs);
    setCommand('');
    toast.success('Command executed');
  };

  const executeSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    const newLogs = [
      ...logs,
      `$ search "${searchQuery}"`,
      `> Searching the web...`,
      `> Found ${Math.floor(Math.random() * 100) + 20} results`,
    ];
    setLogs(newLogs);
    setSearchQuery('');
    toast.success('Search completed');
  };

  return (
    <div id="kimi" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Cpu className="w-10 h-10 text-primary" />
          KIMI Claw Integration
        </h2>
        <p className="text-lg text-muted-foreground">
          Direct access to KIMI AI tools and capabilities.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            File Upload
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload any file to KIMI conversation
          </p>
          <Button
            onClick={handleFileUpload}
            className="w-full gradient-cyber text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-secondary" />
            Shell Access
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Execute bash commands via KIMI
          </p>
          <Button
            onClick={() => {
              setCommand('ls -la');
              setTimeout(executeCommand, 100);
            }}
            className="w-full gradient-ocean text-white"
          >
            <TerminalIcon className="w-4 h-4 mr-2" />
            Shell
          </Button>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-accent" />
            Web Search
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Search the web through KIMI
          </p>
          <Button
            onClick={() => {
              setSearchQuery('latest AI news');
              setTimeout(executeSearch, 100);
            }}
            className="w-full gradient-mint text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-primary" />
            KIMI Terminal
          </h3>
          <div className="p-4 rounded-lg bg-background/70 font-mono text-sm space-y-1 mb-4 max-h-[300px] overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={log.startsWith('$') ? 'text-accent' : 'text-muted-foreground'}>
                {log}
                {i === logs.length - 1 && <span className="animate-pulse">_</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter command..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
              className="bg-background/50 font-mono text-sm"
            />
            <Button onClick={executeCommand} className="gradient-cyber text-white">
              Run
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-accent" />
            Web Search
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              className="bg-background/50"
            />
            <Button onClick={executeSearch} className="gradient-mint text-white">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
            <h4 className="text-sm font-semibold text-primary mb-2">KIMI Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connection</span>
                <span className="text-accent flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bot Token</span>
                <span className="text-foreground font-mono text-xs">sk-***SE2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tools</span>
                <span className="text-foreground">3 enabled</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
