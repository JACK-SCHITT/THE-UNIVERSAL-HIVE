import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Loader2, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('veo-2');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  const generateVideo = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setGeneratedVideo(null);
    setStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          prompt: prompt.trim(),
          model: model === 'veo-2' ? 'google/veo-2' : 'openai/sora-turbo',
          duration: parseInt(duration),
          aspectRatio
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

      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl);
        setStatus('completed');
        toast.success('Video generated successfully!');
      } else {
        setStatus('processing');
        toast.info('Video is being generated... This may take a few minutes');
      }
      
    } catch (error: any) {
      console.error('Video generation error:', error);
      toast.error(error.message || 'Failed to generate video');
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">NSFW Video Generator</h2>
          <p className="text-sm text-muted-foreground">AI video generation with Veo-2 & Sora - no limits</p>
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
              placeholder="Describe the video you want to generate... cinematic, uncensored, unlimited"
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
                  <SelectItem value="veo-2">Google Veo 2</SelectItem>
                  <SelectItem value="sora">OpenAI Sora Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="4:3">4:3 (Classic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm font-bold mb-1">⚠️ NSFW Content Enabled</p>
            <p className="text-xs text-muted-foreground">No censorship, no limits on content generation</p>
          </div>

          <Button
            onClick={generateVideo}
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
                Generate Video
              </>
            )}
          </Button>
        </Card>

        {/* Preview */}
        <Card className="p-6 bg-card/50">
          <h3 className="text-lg font-bold mb-4">Preview</h3>
          {status === 'processing' && (
            <div className="aspect-video bg-background/50 rounded-lg border border-border/50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating video...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take 2-5 minutes</p>
              </div>
            </div>
          )}
          {generatedVideo && status === 'completed' ? (
            <div className="space-y-4">
              <video
                src={generatedVideo}
                controls
                className="w-full rounded-lg border border-border/50"
              />
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedVideo;
                  link.download = `grokschitt-video-${Date.now()}.mp4`;
                  link.click();
                }}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Download Video
              </Button>
            </div>
          ) : !loading && status === 'idle' ? (
            <div className="aspect-video bg-background/50 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Generated video will appear here</p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
