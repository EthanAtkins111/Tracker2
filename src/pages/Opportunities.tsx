import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StrengthBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { getAccounts, getLastInteraction } from "@/lib/store";
import { TrendingUp, AlertTriangle, Bed } from "lucide-react";

export default function Opportunities() {
  const navigate = useNavigate();
  const accounts = getAccounts();

  const getDaysSince = (accountId: string): number | null => {
    const last = getLastInteraction(accountId);
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  // High Priority + Weak relationship
  const highWeakAccounts = accounts.filter(a => a.priorityTier === 'High' && (a.relationshipStrength === 'Weak' || a.relationshipStrength === 'New'));

  // Large bed count not visited recently
  const largeBedStale = accounts
    .filter(a => {
      const days = getDaysSince(a.id);
      return a.bedCount >= 100 && (days === null || days > 30);
    })
    .sort((a, b) => b.bedCount - a.bedCount);

  // Top opportunities: high ADP + weak + no recent
  const topOpps = accounts
    .filter(a => {
      const days = getDaysSince(a.id);
      return a.adpVolume >= 20 && (a.relationshipStrength === 'Weak' || a.relationshipStrength === 'New') && (days === null || days > 14);
    })
    .sort((a, b) => b.adpVolume - a.adpVolume);

  const AccountRow = ({ a }: { a: typeof accounts[0] }) => (
    <div
      className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => navigate(`/accounts/${a.id}`)}
    >
      <div>
        <p className="font-medium text-sm">{a.name}</p>
        <p className="text-xs text-muted-foreground">{a.city} · {a.accountType} · ADP: {a.adpVolume}</p>
      </div>
      <div className="flex items-center gap-2">
        {a.bedCount > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Bed className="h-3 w-3" />{a.bedCount}</span>}
        <PriorityBadge tier={a.priorityTier} />
        <StrengthBadge strength={a.relationshipStrength} />
        <DaysSinceBadge days={getDaysSince(a.id)} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Sales Intelligence</h1>
        <p className="text-muted-foreground text-sm">Top opportunities based on your account data</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Opportunities ({topOpps.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">High ADP volume + weak relationship + no recent interaction</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {topOpps.length === 0 && <p className="text-sm text-muted-foreground py-2">No opportunities found</p>}
            {topOpps.map(a => <AccountRow key={a.id} a={a} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              High Priority + Weak Relationship ({highWeakAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {highWeakAccounts.length === 0 && <p className="text-sm text-muted-foreground py-2">All high-priority accounts have solid relationships</p>}
            {highWeakAccounts.map(a => <AccountRow key={a.id} a={a} />)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bed className="h-4 w-4 text-warning" />
              Large Accounts Not Visited Recently ({largeBedStale.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">100+ beds, 30+ days since last visit</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {largeBedStale.length === 0 && <p className="text-sm text-muted-foreground py-2">All large accounts are up to date</p>}
            {largeBedStale.map(a => <AccountRow key={a.id} a={a} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
