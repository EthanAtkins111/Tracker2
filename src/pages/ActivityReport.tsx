import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchInteractions } from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { Interaction, InteractionType } from "@/lib/types";
import { BarChart2, User, Calendar } from "lucide-react";

const interactionTypes: InteractionType[] = ['Visit', 'Call', 'Email', 'Demo', 'Service Follow-up'];

interface RepStats {
  name: string;
  total: number;
  lastDate: string | null;
  byType: Record<string, number>;
}

export default function ActivityReport() {
  const { isAdmin } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInteractions().then(data => {
      setInteractions(data);
      setLoading(false);
    });
  }, []);

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Admin access required.</div>;
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const repMap = new Map<string, RepStats>();
  for (const i of interactions) {
    const key = i.addedByName || 'Unknown';
    if (!repMap.has(key)) {
      repMap.set(key, { name: key, total: 0, lastDate: null, byType: {} });
    }
    const stats = repMap.get(key)!;
    stats.total += 1;
    stats.byType[i.type] = (stats.byType[i.type] || 0) + 1;
    if (!stats.lastDate || i.date > stats.lastDate) stats.lastDate = i.date;
  }

  const reps = [...repMap.values()].sort((a, b) => b.total - a.total);
  const totalInteractions = interactions.length;
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const monthStart = thisMonth.toISOString().split('T')[0];
  const thisMonthCount = interactions.filter(i => i.date >= monthStart).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" /> Activity Report
        </h1>
        <p className="text-muted-foreground text-sm">Interaction activity by team member</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Interactions</p>
            <p className="text-2xl font-bold">{totalInteractions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-2xl font-bold">{thisMonthCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Reps</p>
            <p className="text-2xl font-bold">{reps.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {reps.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No interactions logged yet.</p>}
        {reps.map(rep => (
          <Card key={rep.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {rep.name}
                <Badge variant="secondary" className="ml-auto">{rep.total} total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {interactionTypes.map(t => {
                  const count = rep.byType[t] || 0;
                  if (!count) return null;
                  return (
                    <span key={t} className="text-xs bg-muted rounded-full px-2.5 py-1">
                      {t}: <strong>{count}</strong>
                    </span>
                  );
                })}
              </div>
              {rep.lastDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last activity: {new Date(rep.lastDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
