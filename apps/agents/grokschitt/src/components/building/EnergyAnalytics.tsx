import { Card } from '@/components/ui/card';
import { TrendingDown, DollarSign, Zap, Award } from 'lucide-react';

export default function EnergyAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Energy Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Real-time energy cost tracking with savings reports and ROI analysis
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Reduction</p>
              <p className="text-2xl font-bold">24%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Annual Savings</p>
              <p className="text-2xl font-bold">$34,164</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">kWh Saved</p>
              <p className="text-2xl font-bold">142,350</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">ROI Period</p>
              <p className="text-2xl font-bold">4.2mo</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50">
          <h4 className="text-lg font-bold mb-4">📊 Monthly Breakdown</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">HVAC Savings</span>
                <span className="text-sm font-bold">$2,847</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Lighting Savings</span>
                <span className="text-sm font-bold">$421</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: '10%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Peak Demand Reduction</span>
                <span className="text-sm font-bold">$580</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: '14%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Other Systems</span>
                <span className="text-sm font-bold">$332</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '8%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="font-bold">Total Monthly Savings</span>
                <span className="text-xl font-bold text-green-500">$4,180</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50">
          <h4 className="text-lg font-bold mb-4">💰 ROI Analysis</h4>
          <div className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Initial Investment</p>
              <p className="text-2xl font-bold">$17,500</p>
            </div>

            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Monthly Savings</p>
              <p className="text-2xl font-bold text-green-500">$4,180</p>
            </div>

            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
              <p className="text-2xl font-bold text-accent">4.2 months</p>
            </div>

            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">5-Year Savings</p>
              <p className="text-2xl font-bold text-purple-500">$250,800</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card/50">
        <h4 className="text-lg font-bold mb-4">🌍 Environmental Impact</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/50 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-500">106 tons</p>
            <p className="text-sm text-muted-foreground mt-2">CO₂ Reduced Annually</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg text-center">
            <p className="text-3xl font-bold text-accent">23</p>
            <p className="text-sm text-muted-foreground mt-2">Cars Off Road Equivalent</p>
          </div>
          <div className="p-4 bg-background/50 rounded-lg text-center">
            <p className="text-3xl font-bold text-yellow-500">442</p>
            <p className="text-sm text-muted-foreground mt-2">Trees Planted Equivalent</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
