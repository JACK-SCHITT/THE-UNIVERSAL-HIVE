import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Image as ImageIcon, Loader2, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux-pro');
  const [size, setSize] = useState('1024x1024');
  const [style, setStyle] = useState('natural');
  const [nsfw, setNsfw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: prompt.trim(),
          model: model === 'flux-pro' ? 'black-forest-labs/flux-1.1-pro' : 'black-forest-labs/flux-1.1-pro-ultra',
          size,
          style,
          nsfw
        }
      });

      if (error) {
        let errorMessage = error.message;
        if (error instanceof FunctionsHttpError) {
          try {
            const textContent = await error.context?.text();
            errorMessage = textContent || error.message;
          } catch {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }

      setGeneratedImage(data.imageUrl);
      toast.success('Image generated successfully!');
      
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `grokschitt-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">NSFW Image Generator</h2>
          <p className="text-sm text-muted-foreground">Uncensored AI image generation - no limits</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="p-6 bg-card/50 space-y-4">
          <div>
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate... no limits, no censorship"
              className="min-h-[120px] bg-background/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flux-pro">Flux 1.1 Pro</SelectItem>
                  <SelectItem value="flux-ultra">Flux 1.1 Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                  <SelectItem value="1024x768">Landscape (1024x768)</SelectItem>
                  <SelectItem value="768x1024">Portrait (768x1024)</SelectItem>
                  <SelectItem value="1920x1080">HD (1920x1080)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="vivid">Vivid</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="photorealistic">Photorealistic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div>
              <Label>NSFW Mode</Label>
              <p className="text-xs text-muted-foreground">Enable uncensored generation</p>
            </div>
            <Switch
              checked={nsfw}
              onCheckedChange={setNsfw}
            />
          </div>

          <Button
            onClick={generateImage}
            disabled={!prompt.trim() || loading}
            className="w-full gradient-cyber text-white gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </Button>
        </Card>

        {/* Preview */}
        <Card className="p-6 bg-card/50">
          <h3 className="text-lg font-bold mb-4">Preview</h3>
          {generatedImage ? (
            <div className="space-y-4">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-lg border border-border/50"
              />
              <Button
                onClick={downloadImage}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Download Image
              </Button>
            </div>
          ) : (
            <div className="aspect-square bg-background/50 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Generated image will appear here</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
