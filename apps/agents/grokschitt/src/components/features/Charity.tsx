import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Home, Utensils, Stethoscope, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface Donor {
  name: string;
  amount: number;
  time: string;
}

export default function Charity() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [totalRaised, setTotalRaised] = useState(0);
  const [stats, setStats] = useState({
    sheltered: 0,
    meals: 0,
    healthcare: 0,
    jobs: 0,
  });

  const donate = (amount: number) => {
    const newDonor: Donor = {
      name: 'Anonymous',
      amount,
      time: new Date().toLocaleTimeString(),
    };

    setDonors([newDonor, ...donors].slice(0, 10));
    setTotalRaised(totalRaised + amount);

    // Update stats based on donation amount
    const newStats = { ...stats };
    if (amount >= 25) newStats.meals += 1;
    if (amount >= 50) newStats.sheltered += 1;
    if (amount >= 100) {
      newStats.healthcare += 1;
      newStats.jobs += 1;
    }
    setStats(newStats);

    toast.success(`Thank you for donating $${amount}!`);
    setCustomAmount('');
  };

  const handleCustomDonate = () => {
    const amount = parseInt(customAmount);
    if (!amount || amount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }
    donate(amount);
  };

  const goal = 1000000;
  const progress = Math.min((totalRaised / goal) * 100, 100);

  return (
    <div id="charity" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Heart className="w-10 h-10 text-accent" />
          Help Homeless Americans
        </h2>
        <p className="text-lg text-muted-foreground">
          Your donation provides shelter, food, healthcare, and job training.
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Raised: <span className="text-2xl font-bold text-accent">${totalRaised.toLocaleString()}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              Goal: <span className="font-semibold">${goal.toLocaleString()}</span>
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">{progress.toFixed(1)}% funded</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button
            onClick={() => donate(25)}
            variant="outline"
            className="h-12 border-accent/30 hover:bg-accent/10"
          >
            $25
          </Button>
          <Button
            onClick={() => donate(50)}
            variant="outline"
            className="h-12 border-accent/30 hover:bg-accent/10"
          >
            $50
          </Button>
          <Button
            onClick={() => donate(100)}
            variant="outline"
            className="h-12 border-accent/30 hover:bg-accent/10"
          >
            $100
          </Button>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="bg-background/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomDonate()}
            />
          </div>
        </div>

        <Button
          onClick={handleCustomDonate}
          className="w-full gradient-mint text-white font-semibold h-12"
        >
          <Heart className="w-5 h-5 mr-2" />
          Donate Now
        </Button>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Sheltered</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.sheltered}</p>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Meals</span>
          </div>
          <p className="text-3xl font-bold text-accent">{stats.meals}</p>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-sm text-muted-foreground">Healthcare</span>
          </div>
          <p className="text-3xl font-bold text-secondary">{stats.healthcare}</p>
        </Card>

        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Jobs</span>
          </div>
          <p className="text-3xl font-bold text-primary">{stats.jobs}</p>
        </Card>
      </div>

      <Card className="p-6 bg-card/50 border-border/50">
        <h3 className="text-xl font-semibold mb-4">Recent Donors</h3>
        {donors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No donations yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {donors.map((donor, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-background/70 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-accent" />
                  </div>
                  <span className="font-medium">{donor.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">${donor.amount}</p>
                  <p className="text-xs text-muted-foreground">{donor.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
