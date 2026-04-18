import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { AccountDialog } from "@/components/AccountDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import { fetchInteractions, fetchLastInteraction } from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Phone, Building2, Users, MapPin, CalendarClock, AlertTriangle, Clock, LogOut, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Interaction } from "@/lib/types";

export default function Dashboard() {
  const { signOut } = useAuth();
  const { accounts, contacts, followUps, loading, refresh, getAccountName, getAccountCity, getContactName, getAccountPriority } = useCrmData();
  const [showAccount, setShowAccount] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const navigate = useNavigate();

  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [lastInteractions, setLastInteractions] = useState<Record<string, Interaction | null>>({});

  useEffect(() => {
    if (accounts.length > 0) {
      // Fetch recent interactions (last 10) and last interaction per account in parallel
      Promise.all([
        fetchInteractions().then(all => all.slice(0, 10)),
        Promise.all(accounts.map(a => fetchLastInteraction(a.id).then(i => [a.id, i] as const)))
      ]).then(([recent, results]) => {
        setRecentInteractions(recent);
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

  // Suggested visits: high priority not visited in 14+ days, then any not visited in 30+ days
  const suggestedVisits = accounts
    .map(a => ({ ...a, daysSince: getDaysSince(a.id) }))
    .filter(a => {
      if (a.priorityTier === 'High') return a.daysSince === null || a.daysSince > 14;
      return a.daysSince === null || a.daysSince > 30;
    })
    .sort((a, b) => {
      // High priority first, then by days since (longest first)
      if (a.priorityTier === 'High' && b.priorityTier !== 'High') return -1;
      if (b.priorityTier === 'High' && a.priorityTier !== 'High') return 1;
      return (b.daysSince ?? 999) - (a.daysSince ?? 999);
    })
    .slice(0, 8);

  // Stats
  const totalAccounts = accounts.length;
  const totalContacts = contacts.length;
  const highPriorityCount = accounts.filter(a => a.priorityTier === 'High').length;
  const overdueCount = dueToday.length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your territory at a glance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowInteraction(true)}>
            <Phone className="mr-1.5 h-3.5 w-3.5" /> <span className="hidden xs:inline">Log</span> Interaction
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAccount(true)}>
            <Building2 className="mr-1.5 h-3.5 w-3.5" /> <span className="hidden sm:inline">Add</span> Account
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowContact(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> <span className="hidden sm:inline">Add</span> Contact
          </Button>
<Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/accounts')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Building2 className="h-3.5 w-3.5" /> Accounts
            </div>
            <p className="text-2xl font-bold">{totalAccounts}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/contacts')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Contacts
            </div>
            <p className="text-2xl font-bold">{totalContacts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> High Priority
            </div>
            <p className="text-2xl font-bold">{highPriorityCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Overdue
            </div>
            <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Visits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" /> Recent Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentInteractions.length === 0 && <p className="text-sm text-muted-foreground py-2">No interactions logged yet</p>}
            {recentInteractions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${interaction.accountId}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(interaction.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {interaction.type} · {getContactName(interaction.contactId)} · {new Date(interaction.date).toLocaleDateString()}
                  </p>
                </div>
                <PriorityBadge tier={getAccountPriority(interaction.accountId)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggested Visits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" /> Suggested Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-80 overflow-y-auto">
            {suggestedVisits.length === 0 && <p className="text-sm text-muted-foreground py-2">All accounts are up to date! 🎉</p>}
            {suggestedVisits.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${a.id}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.city} · {a.bedCount} beds</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <PriorityBadge tier={a.priorityTier} />
                  <DaysSinceBadge days={a.daysSince} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Follow-ups Due */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" /> Follow-ups Due ({dueToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueToday.length === 0 && <p className="text-sm text-muted-foreground py-2">All caught up! 🎉</p>}
            {dueToday.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/accounts/${f.accountId}`)}>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">{getAccountCity(f.accountId)} · {getContactName(f.contactId)}</p>
                </div>
                <PriorityBadge tier={getAccountPriority(f.accountId)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" /> Upcoming 7 Days ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-2">No upcoming follow-ups</p>}
            {upcoming.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/accounts/${f.accountId}`)}>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">{getAccountCity(f.accountId)} · {getContactName(f.contactId)} · Due {new Date(f.dueDate).toLocaleDateString()}</p>
                </div>
                <PriorityBadge tier={getAccountPriority(f.accountId)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AccountDialog open={showAccount} onOpenChange={setShowAccount} onSaved={refresh} />
      <ContactDialog open={showContact} onOpenChange={setShowContact} accounts={accounts} onSaved={refresh} />
      <InteractionDialog open={showInteraction} onOpenChange={setShowInteraction} accounts={accounts} contacts={contacts} onSaved={refresh} />
    </div>
  );
}
