import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Zap, Shield } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-20 border-b border-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-4">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">v18 COMPLETE - All Features Active</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Every Feature.</span><br />
            One Platform.<br />
            No Limits.
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fraud detection + AI Gateway + Universal Connectors + Creation Studio + OnlyFans Manager + Story Studio + Charity + KIMI Claw. All in one.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              className="gradient-cyber text-white font-semibold px-8"
              onClick={() => navigate('/grok-max')}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Try GROK-MAX Chat
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
              onClick={() => document.getElementById('fraud')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Shield className="w-5 h-5 mr-2" />
              Detect Fraud
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
