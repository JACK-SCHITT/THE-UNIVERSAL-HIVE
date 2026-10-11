import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Film, User, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Creation {
  id: string;
  name: string;
  type: string;
  style: string;
  created: string;
}

export default function StoryStudio() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [characterName, setCharacterName] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');

  const createCharacter = () => {
    if (!characterName.trim()) {
      toast.error('Please enter character name');
      return;
    }

    const newCreation: Creation = {
      id: `char-${Date.now()}`,
      name: characterName,
      type: 'Character',
      style: selectedStyle,
      created: new Date().toLocaleString(),
    };

    setCreations([...creations, newCreation]);
    toast.success(`Character "${characterName}" created`);
    setCharacterName('');
  };

  const generateScene = () => {
    if (!sceneName.trim()) {
      toast.error('Please enter scene description');
      return;
    }

    const newCreation: Creation = {
      id: `scene-${Date.now()}`,
      name: sceneName,
      type: 'Scene',
      style: selectedStyle,
      created: new Date().toLocaleString(),
    };

    setCreations([...creations, newCreation]);
    toast.success(`Scene "${sceneName}" generated`);
    setSceneName('');
  };

  const compileMovie = () => {
    if (creations.length === 0) {
      toast.error('Create characters and scenes first');
      return;
    }

    toast.success('Movie compilation started!');
  };

  return (
    <div id="story" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Film className="w-10 h-10 text-primary" />
          Story Studio
        </h2>
        <p className="text-lg text-muted-foreground">
          AI-generated stories and movies with NO RESTRICTIONS.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Character Designer
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Character description (e.g., 'Cyberpunk detective with neon eyes')..."
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="bg-background/50"
            />
            <Button onClick={createCharacter} className="w-full gradient-cyber text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Character
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-secondary" />
            Scene Builder
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="Scene description (e.g., 'Rainy neon city at night')..."
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              className="bg-background/50"
            />
            <Button onClick={generateScene} className="w-full gradient-ocean text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Scene
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Film className="w-5 h-5 text-accent" />
          Movie Compiler
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Cinematic', 'Anime', 'Hyper-Realistic', 'Artistic'].map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedStyle === style
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <Button onClick={compileMovie} className="w-full gradient-mint text-white font-semibold">
            <Film className="w-4 h-4 mr-2" />
            Compile Movie
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4">Your Creations</h3>
        {creations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No creations yet. Start building!
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {creations.map((creation) => (
              <div
                key={creation.id}
                className="p-4 rounded-lg bg-background/70 border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {creation.type}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
                        {creation.style}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm">{creation.name}</h4>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{creation.created}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
