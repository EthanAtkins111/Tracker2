import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import {
  fetchStoreProfiles,
  fetchInteractionsByUserIds,
  fetchFollowUpsByUserIds,
} from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { Interaction, FollowUp, StoreProfile } from "@/lib/types";
import { Clock, AlertTriangle, CalendarClock, Phone, LogOut, Users } from "lucide-react";

export default function RoleDashboard() {
  const { role, signOut } = useAuth();
  const { accounts, contacts, loading, refresh } = useCrmData();
  const navigate = useNavigate();

  const [roleMembers, setRoleMembers] = useState<StoreProfile[]>([]);
  const [roleInteractions, setRoleInteractions] = useState<Interaction[]>([]);
  const [roleFollowUps, setRoleFollowUps] = useState<FollowUp[]>([]);
  const [showInteraction, setShowInteraction] = useState(false);

  const loadData = async () => {
    const profiles = await fetchStoreProfiles();
    const members = profiles.filter(p => p.role === role);
    setRoleMembers(members);
    const memberIds = members.map(m => m.id);
    const [interactions, followUps] = await Promise.all([
      fetchInteractionsByUserIds(memberIds),
      fetchFollowUpsByUserIds(memberIds),
    ]);
    setRoleInteractions(interactions);
    setRoleFollowUps(followUps);
  };

  useEffect(() => { if (!loading) loadData(); }, [loading, role]);

  const handleSaved = () => { refresh(); loadData(); };

  const lastInteractionMap = useMemo(() => {
    const map: Record<string, Interaction> = {};
    for (const i of roleInteractions) {
      if (!map[i.accountId]) map[i.accountId] = i;
    }
    return map;
  }, [roleInteractions]);

  const getDaysSince = (accountId: string): number | null => {
    const last = lastInteractionMap[accountId];
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const pendingFU = roleFollowUps.filter(f => f.status === 'Pending');
  const dueToday = pendingFU.filter(f => f.dueDate <= today);
  const upcoming = pendingFU.filter(f => f.dueDate > today && f.dueDate <= nextWeek);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{role} Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Shared view for your team · {roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowInteraction(true)}>
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
              <Users className="h-3.5 w-3.5" /> Team Members
            </div>
            <p className="text-2xl font-bold">{roleMembers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Phone className="h-3.5 w-3.5" /> Total Interactions
            </div>
            <p className="text-2xl font-bold">{roleInteractions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CalendarClock className="h-3.5 w-3.5" /> Pending Follow-ups
            </div>
            <p className="text-2xl font-bold">{pendingFU.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/follow-ups')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Overdue
            </div>
            <p className="text-2xl font-bold text-destructive">{dueToday.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Team members */}
      {roleMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" /> {role} Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roleMembers.map(m => (
                <span key={m.id} className="text-xs bg-muted rounded-full px-3 py-1 font-medium">
                  {m.fullName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity + Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {roleInteractions.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No interactions logged yet</p>
            )}
            {roleInteractions.slice(0, 6).map(interaction => (
              <div
                key={interaction.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${interaction.accountId}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(interaction.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {interaction.type} · {interaction.addedByName || 'Team'} · {new Date(interaction.date).toLocaleDateString()}
                  </p>
                </div>
                <PriorityBadge tier={getAccountPriority(interaction.accountId)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              Overdue ({dueToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueToday.length === 0 && <p className="text-sm text-muted-foreground py-2">All caught up!</p>}
            {dueToday.slice(0, 5).map((f, i) => (
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
            {upcoming.slice(0, 5).map((f, i) => (
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

      {/* All accounts quick view */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Accounts with Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/accounts')}>
              View all →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts
            .filter(a => lastInteractionMap[a.id])
            .sort((a, b) => {
              const aLast = lastInteractionMap[a.id];
              const bLast = lastInteractionMap[b.id];
              return new Date(bLast.date).getTime() - new Date(aLast.date).getTime();
            })
            .slice(0, 8)
            .map(account => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/accounts/${account.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{account.name}</p>
                    <PriorityBadge tier={account.priorityTier} />
                  </div>
                  <p className="text-xs text-muted-foreground">{account.city} · {account.accountType}</p>
                </div>
                <DaysSinceBadge days={getDaysSince(account.id)} />
              </div>
            ))}
          {accounts.filter(a => lastInteractionMap[a.id]).length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
          )}
        </CardContent>
      </Card>

      <InteractionDialog
        key="role-global"
        open={showInteraction}
        onOpenChange={setShowInteraction}
        accounts={accounts}
        contacts={contacts}
        onSaved={handleSaved}
      />
    </div>
  );
}
