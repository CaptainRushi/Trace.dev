import { useMemo } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContributionDay {
  date: string;
  count: number;
}

export function ContributionGraph() {
  // Generate last 365 days of mock data
  const contributions = useMemo(() => {
    const days: ContributionDay[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random contribution count (weighted towards 0)
      const rand = Math.random();
      let count = 0;
      if (rand > 0.6) count = Math.floor(Math.random() * 3) + 1;
      if (rand > 0.85) count = Math.floor(Math.random() * 5) + 3;
      if (rand > 0.95) count = Math.floor(Math.random() * 8) + 5;
      
      days.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }
    
    return days;
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    for (let i = contributions.length - 1; i >= 0; i--) {
      const day = contributions[i];
      const dayDate = new Date(day.date);
      
      if (day.count > 0) {
        tempStreak++;
        if (i === contributions.length - 1 || contributions[i + 1]?.count > 0) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }
      
      if (dayDate >= weekAgo) thisWeek += day.count;
      if (dayDate >= monthAgo) thisMonth += day.count;
    }
    
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    
    return { currentStreak, longestStreak, thisWeek, thisMonth };
  }, [contributions]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: ContributionDay[][] = [];
    for (let i = 0; i < contributions.length; i += 7) {
      result.push(contributions.slice(i, i + 7));
    }
    return result;
  }, [contributions]);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count <= 2) return 'bg-primary/30';
    if (count <= 4) return 'bg-primary/50';
    if (count <= 6) return 'bg-primary/70';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Current</span>
          </div>
          <div className="font-mono text-2xl text-foreground">{stats.currentStreak}d</div>
        </div>
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Longest</span>
          </div>
          <div className="font-mono text-2xl text-foreground">{stats.longestStreak}d</div>
        </div>
        <div className="border border-border rounded-sm p-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
            This Week
          </div>
          <div className="font-mono text-2xl text-foreground">{stats.thisWeek}</div>
        </div>
        <div className="border border-border rounded-sm p-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
            This Month
          </div>
          <div className="font-mono text-2xl text-foreground">{stats.thisMonth}</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="border border-border rounded-sm p-4 overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className={cn(
                    "w-[10px] h-[10px] rounded-[2px]",
                    getIntensity(day.count)
                  )}
                  title={`${day.date}: ${day.count} contributions`}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-xs font-mono text-muted-foreground">Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/30" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/30" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/50" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/70" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-primary" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
