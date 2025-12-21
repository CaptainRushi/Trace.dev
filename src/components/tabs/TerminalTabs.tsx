import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
}

interface TerminalTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TerminalTabs({ tabs, activeTab, onTabChange }: TerminalTabsProps) {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 text-xs font-mono transition-colors relative",
            activeTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
