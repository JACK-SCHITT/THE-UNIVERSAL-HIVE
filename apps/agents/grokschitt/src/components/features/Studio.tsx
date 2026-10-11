import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Globe, Gamepad2, Brain, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  type: string;
  created: string;
}

const projectTypes = [
  { id: 'app', name: 'Build App', subtitle: 'iOS, Android, Desktop', icon: Smartphone, color: 'from-primary/20 to-primary/5' },
  { id: 'website', name: 'Build Website', subtitle: 'React, Vue, Angular', icon: Globe, color: 'from-secondary/20 to-secondary/5' },
  { id: 'game', name: 'Build Game', subtitle: 'Unity, Unreal, WebGL', icon: Gamepad2, color: 'from-accent/20 to-accent/5' },
  { id: 'ai', name: 'Build AI Agent', subtitle: 'Custom GPT agents', icon: Brain, color: 'from-primary/20 to-secondary/5' },
];

export default function Studio() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const createProject = () => {
    if (!projectName.trim() || !selectedType) {
      toast.error('Please enter project name and select type');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      type: selectedType,
      created: new Date().toLocaleDateString(),
    };

    setProjects([...projects, newProject]);
    toast.success(`Project "${projectName}" created`);
    setProjectName('');
    setSelectedType('');
  };

  return (
    <div id="studio" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Plus className="w-10 h-10 text-primary" />
          Creation Studio
        </h2>
        <p className="text-lg text-muted-foreground">
          Build apps, websites, games, and AI agents with no limits.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projectTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <Card
              key={type.id}
              className={`p-6 bg-gradient-to-br ${type.color} border-border/50 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-lg bg-background/30 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">{type.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{type.subtitle}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <Card className="p-6 bg-card/50 border-primary/30">
          <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              className="bg-background/50"
            />
            <Button onClick={createProject} className="gradient-cyber text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4">Your Projects</h3>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No projects yet. Create one above!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg bg-background/70 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{project.name}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                    {project.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Created: {project.created}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
