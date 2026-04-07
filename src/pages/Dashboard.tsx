import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { AccountDialog } from "@/components/AccountDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import { fetchLastInteraction, seedRegionData } from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Phone, Building2, CalendarClock, AlertTriangle, Clock, LogOut } from "lucide-react";
import { useEffect } from "react";
import { Interaction } from "@/lib/types";

export default function Dashboard() {
  const { signOut } = useAuth();
  const { accounts, contacts, followUps, loading, refresh, getAccountName, getAccountCity, getContactName, getAccountPriority } = useCrmData();
  const [showAccount, setShowAccount] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const navigate = useNavigate();

  // Cache last interactions per account
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

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const pendingFollowUps = followUps.filter(f => f.status === 'Pending');
  const dueToday = pendingFollowUps.filter(f => f.dueDate <= today);
  const upcoming = pendingFollowUps.filter(f => f.dueDate > today && f.dueDate <= nextWeek);

  const getDaysSince = (accountId: string): number | null => {
    const last = lastInteractions[accountId];
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  const highPriorityNeedingAttention = accounts.filter(a => {
    if (a.priorityTier !== 'High') return false;
    const days = getDaysSince(a.id);
    return days === null || days > 14;
  });

  const notVisited30Days = accounts.filter(a => {
    const days = getDaysSince(a.id);
    return days === null || days > 30;
  });

  interface FollowUpItem { accountId: string; contactId: string; dueDate: string; }
  const FollowUpRow = ({ item }: { item: FollowUpItem }) => (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/accounts/${item.accountId}`)}>
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{getAccountName(item.accountId)}</p>
        <p className="text-xs text-muted-foreground">{getAccountCity(item.accountId)} · {getContactName(item.contactId)}</p>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <PriorityBadge tier={getAccountPriority(item.accountId)} />
        <DaysSinceBadge days={getDaysSince(item.accountId)} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your territory at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowInteraction(true)}>
            <Phone className="mr-1.5 h-3.5 w-3.5" /> Log Interaction
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAccount(true)}>
            <Building2 className="mr-1.5 h-3.5 w-3.5" /> Add Account
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowContact(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Contact
          </Button>
          <Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Follow-ups Due Today ({dueToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueToday.length === 0 && <p className="text-sm text-muted-foreground py-2">All caught up! 🎉</p>}
            {dueToday.map((f, i) => <FollowUpRow key={i} item={f} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-info" /> Upcoming 7 Days ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-2">No upcoming follow-ups</p>}
            {upcoming.map((f, i) => <FollowUpRow key={i} item={f} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> High Priority Needing Attention ({highPriorityNeedingAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {highPriorityNeedingAttention.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/accounts/${a.id}`)}>
                <div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-muted-foreground">{a.city}</p></div>
                <DaysSinceBadge days={getDaysSince(a.id)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Not Visited 30+ Days ({notVisited30Days.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-64 overflow-y-auto">
            {notVisited30Days.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/accounts/${a.id}`)}>
                <div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-muted-foreground">{a.city} · {a.bedCount} beds</p></div>
                <div className="flex items-center gap-2"><PriorityBadge tier={a.priorityTier} /><DaysSinceBadge days={getDaysSince(a.id)} /></div>
              </div>
            ))}
            {notVisited30Days.length > 10 && <p className="text-xs text-muted-foreground text-center py-1">+{notVisited30Days.length - 10} more</p>}
          </CardContent>
        </Card>
      </div>

      <AccountDialog open={showAccount} onOpenChange={setShowAccount} onSaved={refresh} />
      <ContactDialog open={showContact} onOpenChange={setShowContact} accounts={accounts} onSaved={refresh} />
      <InteractionDialog open={showInteraction} onOpenChange={setShowInteraction} accounts={accounts} contacts={contacts} onSaved={refresh} />
    </div>
  );
}
