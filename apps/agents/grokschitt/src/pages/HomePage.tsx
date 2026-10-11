import { useState } from 'react';
import Header from '@/components/layout/Header';
import Hero from '@/components/layout/Hero';
import FeatureNav from '@/components/layout/FeatureNav';
import Footer from '@/components/layout/Footer';
import FraudBrain from '@/components/features/FraudBrain';
import Gateway from '@/components/features/Gateway';
import Connectors from '@/components/features/Connectors';
import Studio from '@/components/features/Studio';
import OnlyFansManager from '@/components/features/OnlyFansManager';
import StoryStudio from '@/components/features/StoryStudio';
import Charity from '@/components/features/Charity';
import KimiClaw from '@/components/features/KimiClaw';
import NewsletterSignup from '@/components/features/NewsletterSignup';
import EnhancedFraudDetector from '@/components/features/EnhancedFraudDetector';
import Dashboard from '@/components/analytics/Dashboard';
import UserSettings from '@/components/settings/UserSettings';
import AdminPanel from '@/components/admin/AdminPanel';
import ImageGenerator from '@/components/creation/ImageGenerator';
import VideoGenerator from '@/components/creation/VideoGenerator';
import UserProfileView from '@/components/profile/UserProfileView';
import WorkspaceManager from '@/components/collaboration/WorkspaceManager';
import RuViewHub from '@/components/ruview/RuViewHub';
import FunctionFactory from '@/components/ai-factory/FunctionFactory';
import RoboticsHub from '@/components/robotics/RoboticsHub';
import SmartBuildingDashboard from '@/components/building/SmartBuildingDashboard';
import TestModePanel from '@/components/test-mode/TestModePanel';

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<string>('fraud');

  const features = [
    { id: 'fraud', name: 'FraudBrain', icon: '🛡️', component: FraudBrain },
    { id: 'gateway', name: 'Gateway', icon: '🌐', component: Gateway },
    { id: 'connect', name: 'Connectors', icon: '🔌', component: Connectors },
    { id: 'studio', name: 'Studio', icon: '🛠️', component: Studio },
    { id: 'onlyfans', name: 'OnlyFans', icon: '💰', component: OnlyFansManager },
    { id: 'story', name: 'Story', icon: '🎬', component: StoryStudio },
    { id: 'charity', name: 'Charity', icon: '💚', component: Charity },
    { id: 'kimi', name: 'KIMI', icon: '🤖', component: KimiClaw },
    { id: 'images', name: 'Images', icon: '🎨', component: ImageGenerator },
    { id: 'videos', name: 'Videos', icon: '🎬', component: VideoGenerator },
    { id: 'analytics', name: 'Analytics', icon: '📊', component: Dashboard },
    { id: 'admin', name: 'Admin', icon: '👑', component: AdminPanel },
    { id: 'profile', name: 'Profile', icon: '👤', component: UserProfileView },
    { id: 'workspace', name: 'Workspace', icon: '👥', component: WorkspaceManager },
    { id: 'ruview', name: 'RuView', icon: '📡', component: RuViewHub },
    { id: 'ai-factory', name: 'AI Factory', icon: '🧠', component: FunctionFactory },
    { id: 'robotics', name: 'Robotics', icon: '🤖', component: RoboticsHub },
    { id: 'building', name: 'Building', icon: '🏢', component: SmartBuildingDashboard },
    { id: 'settings', name: 'Settings', icon: '⚙️', component: UserSettings },
  ];

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || FraudBrain;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      <Header />
      <Hero />
      <FeatureNav features={features} activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <ActiveComponent />
        
        {/* Enhanced RL Fraud Detection */}
        <div className="mt-12">
          <EnhancedFraudDetector />
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12">
          <NewsletterSignup />
        </div>

        {/* Test Mode Panel */}
        <div className="mt-12">
          <TestModePanel />
        </div>
      </main>

      <Footer />
    </div>
  );
}
