import { Card } from '@/components/ui/card';
import { ExternalLink, Shield, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-24">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg gradient-cyber flex items-center justify-center">
                <span className="text-xl font-bold text-white">G</span>
              </div>
              <span className="text-xl font-bold text-gradient">GROKSCHITT</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              v18 COMPLETE EDITION
            </p>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded bg-accent/20 text-xs font-medium text-accent flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Secure
              </div>
              <div className="px-2 py-1 rounded bg-primary/20 text-xs font-medium text-primary flex items-center gap-1">
                <Zap className="w-3 h-3" />
                AI-Powered
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>FraudBrain AI Detection</li>
              <li>WebSocket Gateway</li>
              <li>Universal Connectors</li>
              <li>Creation Studio</li>
              <li>Story Studio</li>
              <li>KIMI Claw Integration</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Powered By</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <a 
                  href="https://www.youware.com/?via=edward-oliphant" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  YouWare Platform
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <span>Klaviyo Email Marketing</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <span>Salable Licensing</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="w-3 h-3" />
                <span>OnSpace AI</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Core Values</h3>
            <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 mb-3">
              <p className="text-sm font-bold text-primary mb-1">
                NEVER LEAVE A FRIEND BEHIND
              </p>
              <p className="text-xs text-muted-foreground">
                Unbreakable loyalty to users
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
              <p className="text-sm font-bold text-secondary mb-1">
                SECRETS DON'T MAKE FRIENDS
              </p>
              <p className="text-xs text-muted-foreground">
                Complete transparency
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 GROKSCHITT. All features active. No limits.
            </p>
            <div className="flex gap-4 text-sm">
              <a 
                href="https://www.youware.com/?via=KRACKERJACK1134" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Affiliate Program
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
