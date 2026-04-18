import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StrengthBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { useCrmData } from "@/hooks/use-crm-data";
import { fetchLastInteraction } from "@/lib/supabase-store";
import { Interaction } from "@/lib/types";
import { TrendingUp, AlertTriangle, Bed } from "lucide-react";

export default function Opportunities() {
  const navigate = useNavigate();
  const { accounts, loading } = useCrmData();
  const [lastInteractions, setLastInteractions] = useState<Record<string, Interaction | null>>({});

  useEffect(() => {
    if (accounts.length > 0) {
      Promise.all(accounts.map(a => fetchLastInteraction(a.id).then(i => [a.id, i] as const)))
        .then(results => {
          const map: Record<string, Interaction | null> = {};
          results.forEach(([id, i]) => { map[id] = i; });
          setLastInteractions(map);
        });
    }
  }, [accounts]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const getDaysSince = (accountId: string): number | null => {
    const last = lastInteractions[accountId];
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  const highWeakAccounts = accounts.filter(a => a.priorityTier === 'High' && (a.relationshipStrength === 'Weak' || a.relationshipStrength === 'New'));
  const largeBedStale = accounts.filter(a => { const days = getDaysSince(a.id); return a.bedCount >= 100 && (days === null || days > 30); }).sort((a, b) => b.bedCount - a.bedCount);
  const topOpps = accounts.filter(a => { const days = getDaysSince(a.id); return (a.relationshipStrength === 'Weak' || a.relationshipStrength === 'New') && (days === null || days > 14); }).sort((a, b) => b.bedCount - a.bedCount);

  const AccountRow = ({ a }: { a: typeof accounts[0] }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/accounts/${a.id}`)}>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{a.name}</p>
        <p className="text-xs text-muted-foreground truncate">{a.city} · {a.accountType}{a.adpVolume ? ` · ADP: ${a.adpVolume}` : ''}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {a.bedCount > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Bed className="h-3 w-3" />{a.bedCount}</span>}
        <PriorityBadge tier={a.priorityTier} />
        <span className="hidden sm:block"><StrengthBadge strength={a.relationshipStrength} /></span>
        <DaysSinceBadge days={getDaysSince(a.id)} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Sales Intelligence</h1>
        <p className="text-muted-foreground text-sm">Top opportunities based on your account data</p>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary shrink-0" /> Top Opportunities ({topOpps.length})</CardTitle>
            <p className="text-xs text-muted-foreground">Weak relationship + no recent interaction</p>
          </CardHeader>
          <CardContent className="space-y-1 max-h-80 overflow-y-auto">
            {topOpps.length === 0 && <p className="text-sm text-muted-foreground py-2">No opportunities found</p>}
            {topOpps.map(a => <AccountRow key={a.id} a={a} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive shrink-0" /> High Priority + Weak ({highWeakAccounts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-80 overflow-y-auto">
            {highWeakAccounts.length === 0 && <p className="text-sm text-muted-foreground py-2">All high-priority accounts have solid relationships</p>}
            {highWeakAccounts.map(a => <AccountRow key={a.id} a={a} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2"><Bed className="h-4 w-4 text-warning shrink-0" /> Large Accounts Stale ({largeBedStale.length})</CardTitle>
            <p className="text-xs text-muted-foreground">100+ beds, 30+ days since last visit</p>
          </CardHeader>
          <CardContent className="space-y-1 max-h-80 overflow-y-auto">
            {largeBedStale.length === 0 && <p className="text-sm text-muted-foreground py-2">All large accounts are up to date</p>}
            {largeBedStale.map(a => <AccountRow key={a.id} a={a} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
