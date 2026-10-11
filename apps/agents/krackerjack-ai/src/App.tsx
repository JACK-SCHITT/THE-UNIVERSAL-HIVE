import { HiveProvider, useHive } from '@/hooks/useHive';
import { Layout } from '@/components/layout/Layout';
import { FoundryPage } from '@/pages/FoundryPage';
import { HunterPage } from '@/pages/HunterPage';
import { ChatPage } from '@/pages/ChatPage';
import { DnaPage } from '@/pages/DnaPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SearchPage } from '@/pages/SearchPage';
import { TerminalPage } from '@/pages/TerminalPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { ScriptForgePage } from '@/pages/ScriptForgePage';
import { BotSenderPage } from '@/pages/BotSenderPage';
import { DeviceBridgePage } from '@/pages/DeviceBridgePage';
import { Toaster } from 'sonner';

function AppContent() {
  const { activeTab } = useHive();

  const renderPage = () => {
    switch (activeTab) {
      case 'foundry':   return <FoundryPage />;
      case 'hunter':    return <HunterPage />;
      case 'chat':      return <ChatPage />;
      case 'dna':       return <DnaPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'forge':     return <ScriptForgePage />;
      case 'bot':       return <BotSenderPage />;
      case 'device':    return <DeviceBridgePage />;
      case 'search':    return <SearchPage />;
      case 'terminal':  return <TerminalPage />;
      case 'config':    return <ConfigPage />;
      default:          return <FoundryPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <HiveProvider>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#161616',
            border: '1px solid #f5a62333',
            color: '#f5a623',
            fontFamily: 'JetBrains Mono, monospace',
          },
        }}
      />
      <AppContent />
    </HiveProvider>
  );
}
