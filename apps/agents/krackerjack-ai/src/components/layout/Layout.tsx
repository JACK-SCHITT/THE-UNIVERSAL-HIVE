import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hive-black flex flex-col max-w-lg mx-auto relative">
      <TopBar />
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
