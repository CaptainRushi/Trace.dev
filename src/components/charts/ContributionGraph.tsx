
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useProjectStore } from '@/stores/projectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from 'react';
import { toast } from 'sonner';

export function ContributionGraph() {
  const { stats, refreshStats, selectedProjectId } = useProjectStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!selectedProjectId) return;
    setRefreshing(true);
    try {
      await refreshStats(selectedProjectId);
      toast.success("Stats updated");
    } catch (error: any) {
      toast.error("Failed to refresh stats");
    } finally {
      setRefreshing(false);
    }
  };

  const data = stats.map(s => ({
    date: s.activity_date,
    score: s.activity_score
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Contribution Velocity</CardTitle>
          <CardDescription>Activity score derived from daily logs</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Recalculate
        </Button>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Not enough data to graph
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
