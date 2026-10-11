import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, DollarSign, FileImage, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Model {
  id: string;
  name: string;
  split: string;
  revenue: number;
  content: number;
}

export default function OnlyFansManager() {
  const [models, setModels] = useState<Model[]>([]);
  const [modelName, setModelName] = useState('');
  const [selectedSplit, setSelectedSplit] = useState('70/30');

  const addModel = () => {
    if (!modelName.trim()) {
      toast.error('Please enter model name');
      return;
    }

    const newModel: Model = {
      id: `model-${Date.now()}`,
      name: modelName,
      split: selectedSplit,
      revenue: 0,
      content: 0,
    };

    setModels([...models, newModel]);
    toast.success(`Model "${modelName}" added`);
    setModelName('');
  };

  const totalRevenue = models.reduce((acc, m) => acc + m.revenue, 0);
  const totalContent = models.reduce((acc, m) => acc + m.content, 0);

  return (
    <div id="onlyfans" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Users className="w-10 h-10 text-primary" />
          OnlyFans Manager
        </h2>
        <p className="text-lg text-muted-foreground">
          Model management, content review, and revenue tracking.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Models</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-4xl font-bold text-primary">{models.length}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
          <p className="text-4xl font-bold text-accent">${totalRevenue}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Content Items</span>
            <FileImage className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-4xl font-bold text-secondary">{totalContent}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-muted/20 to-muted/5 border-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pending Review</span>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-4xl font-bold text-muted-foreground">0</p>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4">Add Model</h3>
        <div className="space-y-4">
          <Input
            placeholder="Model name..."
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="bg-background/50"
          />
          
          <div className="grid grid-cols-3 gap-2">
            {['70/30', '80/20', '90/10'].map((split) => (
              <button
                key={split}
                onClick={() => setSelectedSplit(split)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedSplit === split
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {split === '70/30' && 'Standard (70/30 split)'}
                {split === '80/20' && 'Premium (80/20 split)'}
                {split === '90/10' && 'VIP (90/10 split)'}
              </button>
            ))}
          </div>

          <Button onClick={addModel} className="w-full gradient-cyber text-white">
            Add Model
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4">Content Review</h3>
        <p className="text-sm text-muted-foreground py-8 text-center">
          No content pending review
        </p>
      </Card>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4">Models</h3>
        {models.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No models added yet
          </p>
        ) : (
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model.id}
                className="p-4 rounded-lg bg-background/70 border border-border flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{model.name}</p>
                  <p className="text-xs text-muted-foreground">Split: {model.split}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">${model.revenue}</p>
                  <p className="text-xs text-muted-foreground">{model.content} items</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
