import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Tab {
  id: string;
  label: string;
  isLocked?: boolean;
  locked?: 'database' | 'tracedraw';
}

interface TerminalTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TerminalTabs({ tabs, activeTab, onTabChange }: TerminalTabsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex border-b border-border overflow-x-auto">
      {tabs.map((tab) => {
        // Locked tab
        if (tab.isLocked) {
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/pricing')}
                  className={cn(
                    "px-4 py-2 text-xs font-mono transition-colors relative flex items-center gap-1.5",
                    "text-muted-foreground/50 cursor-pointer hover:text-muted-foreground"
                  )}
                >
                  <Lock className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="flex items-center gap-2">
                  <span>🔒 Upgrade to unlock {tab.label}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }

        // Normal tab
        return (
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
        );
      })}
    </div>
  );
}
