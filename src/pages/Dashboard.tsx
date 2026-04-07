import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { AccountDialog } from "@/components/AccountDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { getAccounts, getFollowUps, getContacts, getLastInteraction, seedData } from "@/lib/store";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { Plus, Phone, Building2, CalendarClock, AlertTriangle, Clock } from "lucide-react";

export default function Dashboard() {
  const refresh = useStoreRefresh();
  const [showAccount, setShowAccount] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { seedData(); }, []);

  const accounts = getAccounts();
  const followUps = getFollowUps().filter(f => f.status === 'Pending');
  const contacts = getContacts();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const dueToday = followUps.filter(f => f.dueDate <= today);
  const upcoming = followUps.filter(f => f.dueDate > today && f.dueDate <= nextWeek);

  const highPriorityNeedingAttention = accounts.filter(a => {
    if (a.priorityTier !== 'High') return false;
    const last = getLastInteraction(a.id);
    if (!last) return true;
    const days = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
    return days > 14;
  });

  const notVisited30Days = accounts.filter(a => {
    const last = getLastInteraction(a.id);
    if (!last) return true;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000) > 30;
  });

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getAccountCity = (id: string) => accounts.find(a => a.id === id)?.city || '';
  const getContactName = (id: string) => contacts.find(c => c.id === id)?.name || '—';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';

  const getDaysSince = (accountId: string): number | null => {
    const last = getLastInteraction(accountId);
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  const handleRefresh = () => refresh();

  interface FollowUpItem {
    accountId: string;
    contactId: string;
    dueDate: string;
  }

  const FollowUpRow = ({ item }: { item: FollowUpItem }) => (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => navigate(`/accounts/${item.accountId}`)}
    >
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Follow-ups Due Today ({dueToday.length})
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
              <CalendarClock className="h-4 w-4 text-info" />
              Upcoming 7 Days ({upcoming.length})
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
              <AlertTriangle className="h-4 w-4 text-warning" />
              High Priority Needing Attention ({highPriorityNeedingAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {highPriorityNeedingAttention.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${a.id}`)}
              >
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.city}</p>
                </div>
                <DaysSinceBadge days={getDaysSince(a.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Not Visited 30+ Days ({notVisited30Days.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {notVisited30Days.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${a.id}`)}
              >
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.city} · {a.bedCount} beds</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge tier={a.priorityTier} />
                  <DaysSinceBadge days={getDaysSince(a.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AccountDialog open={showAccount} onOpenChange={setShowAccount} onSaved={handleRefresh} />
      <ContactDialog open={showContact} onOpenChange={setShowContact} onSaved={handleRefresh} />
      <InteractionDialog open={showInteraction} onOpenChange={setShowInteraction} onSaved={handleRefresh} />
    </div>
  );
}
