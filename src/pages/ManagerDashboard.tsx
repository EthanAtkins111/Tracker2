import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, DaysSinceBadge, StrengthBadge } from "@/components/StatusBadges";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import { fetchInteractions, fetchFollowUps, fetchStoreProfiles } from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { Interaction, FollowUp, StoreProfile } from "@/lib/types";
import {
  Users, Building2, Clock, AlertTriangle, CalendarClock, Phone, LogOut, TrendingUp,
} from "lucide-react";

export default function ManagerDashboard() {
  const { signOut } = useAuth();
  const { accounts, contacts, loading, refresh } = useCrmData();
  const navigate = useNavigate();

  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>([]);
  const [storeProfiles, setStoreProfiles] = useState<StoreProfile[]>([]);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionAccountId, setInteractionAccountId] = useState<string | undefined>(undefined);

  const loadData = () => {
    fetchInteractions().then(setAllInteractions);
    fetchFollowUps().then(setAllFollowUps);
    fetchStoreProfiles().then(setStoreProfiles);
  };

  useEffect(() => { if (!loading) loadData(); }, [loading]);

  const handleSaved = () => { refresh(); loadData(); };

  // Map accountId → last interaction date (any rep)
  const lastInteractionMap = useMemo(() => {
    const map: Record<string, Interaction> = {};
    for (const i of allInteractions) {
      if (!map[i.accountId]) map[i.accountId] = i;
    }
    return map;
  }, [allInteractions]);

  const getDaysSince = (accountId: string): number | null => {
    const last = lastInteractionMap[accountId];
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  // Rep stats for this week and this month
  const now = Date.now();
  const weekCutoff = new Date(now - 7 * 86400000).toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthCutoff = monthStart.toISOString().split('T')[0];

  const repStats = useMemo(() => {
    const salesReps = storeProfiles.filter(p => p.role === 'Sales');
    return salesReps.map(rep => {
      const repInteractions = allInteractions.filter(i => i.userId === rep.id);
      return {
        ...rep,
        weekCount: repInteractions.filter(i => i.date >= weekCutoff).length,
        monthCount: repInteractions.filter(i => i.date >= monthCutoff).length,
        totalCount: repInteractions.length,
      };
    }).sort((a, b) => b.monthCount - a.monthCount);
  }, [storeProfiles, allInteractions, weekCutoff, monthCutoff]);

  // Overdue follow-ups across all reps
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(now + 7 * 86400000).toISOString().split('T')[0];
  const pendingFU = allFollowUps.filter(f => f.status === 'Pending');
  const dueToday = pendingFU.filter(f => f.dueDate <= today);
  const upcoming = pendingFU.filter(f => f.dueDate > today && f.dueDate <= nextWeek);

  // Top accounts by priority (sorted High → Medium → Low, then stale first)
  const topAccounts = useMemo(() => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return [...accounts].sort((a, b) => {
      const pd = priorityOrder[a.priorityTier] - priorityOrder[b.priorityTier];
      if (pd !== 0) return pd;
      const aDays = getDaysSince(a.id) ?? 9999;
      const bDays = getDaysSince(b.id) ?? 9999;
      return bDays - aDays;
    }).slice(0, 10);
  }, [accounts, lastInteractionMap]);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground text-sm">Store-wide overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { setInteractionAccountId(undefined); setShowInteraction(true); }}>
            <Phone className="mr-1.5 h-3.5 w-3.5" /> Log Interaction
          </Button>
          <Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Building2 className="h-3.5 w-3.5" /> Total Accounts
            </div>
            <p className="text-2xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Sales Reps
            </div>
            <p className="text-2xl font-bold">{storeProfiles.filter(p => p.role === 'Sales').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> This Week
            </div>
            <p className="text-2xl font-bold">{allInteractions.filter(i => i.date >= weekCutoff).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">interactions</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/follow-ups')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Overdue
            </div>
            <p className="text-2xl font-bold text-destructive">{dueToday.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">follow-ups</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rep leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" /> Sales Rep Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {repStats.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No sales reps in store yet</p>
            )}
            {repStats.map(rep => (
              <div key={rep.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{rep.fullName}</p>
                  <p className="text-xs text-muted-foreground">{rep.monthCount} this month · {rep.weekCount} this week</p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{rep.totalCount} total</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent interactions (all reps) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {allInteractions.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No interactions logged yet</p>
            )}
            {allInteractions.slice(0, 6).map(interaction => (
              <div
                key={interaction.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${interaction.accountId}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(interaction.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {interaction.type} · {interaction.addedByName || 'Unknown'} · {new Date(interaction.date).toLocaleDateString()}
                  </p>
                </div>
                <PriorityBadge tier={getAccountPriority(interaction.accountId)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overdue + upcoming follow-ups */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                Overdue ({dueToday.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {dueToday.length === 0 && <p className="text-sm text-muted-foreground py-2">All caught up!</p>}
              {dueToday.slice(0, 4).map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/accounts/${f.accountId}`)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                    <p className="text-xs text-muted-foreground">Due {new Date(f.dueDate).toLocaleDateString()}</p>
                  </div>
                  <PriorityBadge tier={getAccountPriority(f.accountId)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
                Next 7 Days ({upcoming.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-2">Nothing due soon</p>}
              {upcoming.slice(0, 4).map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/accounts/${f.accountId}`)}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                    <p className="text-xs text-muted-foreground">Due {new Date(f.dueDate).toLocaleDateString()}</p>
                  </div>
                  <PriorityBadge tier={getAccountPriority(f.accountId)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top accounts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" /> Top Accounts by Priority
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/accounts')}>
              View all →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {topAccounts.map((account, idx) => (
            <div
              key={account.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{account.name}</p>
                  <PriorityBadge tier={account.priorityTier} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{account.city}</span>
                  {account.accountManager && (
                    <span className="text-xs text-muted-foreground">· {account.accountManager}</span>
                  )}
                  <StrengthBadge strength={account.relationshipStrength} />
                  <DaysSinceBadge days={getDaysSince(account.id)} />
                </div>
              </div>
            </div>
          ))}
          {topAccounts.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No accounts yet</p>}
        </CardContent>
      </Card>

      <InteractionDialog
        key={interactionAccountId ?? 'manager-global'}
        open={showInteraction}
        onOpenChange={setShowInteraction}
        defaultAccountId={interactionAccountId}
        accounts={accounts}
        contacts={contacts}
        onSaved={handleSaved}
      />
    </div>
  );
}
