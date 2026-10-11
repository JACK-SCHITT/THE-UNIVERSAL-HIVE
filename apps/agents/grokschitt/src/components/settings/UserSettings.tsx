import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Bell, Shield, Sparkles, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function UserSettings() {
  const [settings, setSettings] = useState({
    email: '',
    emailAlerts: true,
    fraudAlerts: true,
    marketingEmails: false,
    twoFactor: false
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-cyber flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">User Settings</h2>
          <p className="text-sm text-muted-foreground">Customize your GROKSCHITT experience</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <Card className="p-6 bg-card/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Account
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="your@email.com"
                className="bg-background/50"
              />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 bg-card/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-secondary" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive important updates</p>
              </div>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Fraud Alerts</Label>
                <p className="text-xs text-muted-foreground">Real-time fraud notifications</p>
              </div>
              <Switch
                checked={settings.fraudAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, fraudAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">Product updates and tips</p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onCheckedChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 bg-card/50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Extra account security</p>
              </div>
              <Switch
                checked={settings.twoFactor}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactor: checked })}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <h3 className="text-lg font-bold mb-2">Save Changes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click below to save your preferences
          </p>
          <Button onClick={handleSave} className="w-full gradient-cyber text-white gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </Card>
      </div>
    </div>
  );
}
