import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('klaviyo-subscribe', {
        body: {
          email: email.trim(),
          properties: {
            platform: 'GROKSCHITT v18',
            signup_source: 'homepage'
          }
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

      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
      
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast.error(error.message || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 gradient-cyber-subtle border-primary/30">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-cyber flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gradient">Stay Updated</h2>
        <p className="text-muted-foreground">
          Get the latest updates, fraud alerts, and exclusive features delivered to your inbox.
        </p>
        <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/50"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="gradient-cyber text-white px-8"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Powered by Klaviyo • No spam, unsubscribe anytime
        </p>
      </div>
    </Card>
  );
}
