import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  name: string;
  icon: string;
}

interface FeatureNavProps {
  features: Feature[];
  activeFeature: string;
  setActiveFeature: (id: string) => void;
}

export default function FeatureNav({ features, activeFeature, setActiveFeature }: FeatureNavProps) {
  return (
    <nav className="sticky top-[73px] z-40 bg-card/80 backdrop-blur-md border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
                activeFeature === feature.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="text-lg">{feature.icon}</span>
              <span className="hidden sm:inline">{feature.name}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
