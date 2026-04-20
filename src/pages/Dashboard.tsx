import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PriorityBadge, DaysSinceBadge, StrengthBadge } from "@/components/StatusBadges";
import { AccountDialog } from "@/components/AccountDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import { fetchInteractions } from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { Account, Interaction } from "@/lib/types";
import {
  Plus, Phone, Clock, LogOut, Building2,
  Star, ChevronRight, CalendarClock,
  Sparkles, Pencil, Check, X, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Pinned account picker dialog ────────────────────────────────────────────
interface PickerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  max: number;
  accounts: Account[];
  selected: string[];
  onSave: (ids: string[]) => void;
}

function AccountPickerDialog({ open, onOpenChange, title, max, accounts, selected, onSave }: PickerProps) {
  const [draft, setDraft] = useState<string[]>(selected);

  useEffect(() => { if (open) setDraft(selected); }, [open, selected]);

  const toggle = (id: string) => {
    setDraft(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < max ? [...prev, id] : prev
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">Select up to {max} accounts. Click an account to add or remove it.</p>
        </DialogHeader>

        {draft.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {draft.map(id => {
              const a = accounts.find(x => x.id === id);
              if (!a) return null;
              return (
                <span key={id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {a.name}
                  <button onClick={() => toggle(id)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <Command className="border rounded-md">
          <CommandInput placeholder="Search accounts..." />
          <CommandList className="max-h-64">
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              {accounts.map(a => {
                const isSelected = draft.includes(a.id);
                const isDisabled = !isSelected && draft.length >= max;
                return (
                  <CommandItem
                    key={a.id}
                    value={`${a.name} ${a.city}`}
                    onSelect={() => toggle(a.id)}
                    className={cn(isDisabled && "opacity-40 cursor-not-allowed")}
                  >
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", isSelected ? "opacity-100 text-primary" : "opacity-0")} />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm">{a.name}</span>
                      {a.city && <span className="text-muted-foreground text-xs ml-2">{a.city}</span>}
                    </div>
                    <PriorityBadge tier={a.priorityTier} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>

        <p className="text-xs text-muted-foreground text-right">{draft.length}/{max} selected</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(draft); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { signOut, user } = useAuth();
  const { accounts, contacts, followUps, loading, refresh } = useCrmData();
  const navigate = useNavigate();

  const top5Key   = user ? `mh_top5_${user.id}`   : 'mh_top5';
  const oppsKey   = user ? `mh_opps_${user.id}`    : 'mh_opps';

  const [showAccount,    setShowAccount]    = useState(false);
  const [showContact,    setShowContact]    = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionAccountId, setInteractionAccountId] = useState<string | undefined>(undefined);
  const [allInteractions, setAllInteractions] = useState<Interaction[]>([]);

  // Pinned IDs – persisted to localStorage
  const [pinnedTop5Ids, setPinnedTop5Ids] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(top5Key) || '[]'); } catch { return []; }
  });
  const [pinnedOppsIds, setPinnedOppsIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(oppsKey) || '[]'); } catch { return []; }
  });

  const [editTop5Open, setEditTop5Open] = useState(false);
  const [editOppsOpen, setEditOppsOpen] = useState(false);

  const saveTop5 = (ids: string[]) => {
    setPinnedTop5Ids(ids);
    localStorage.setItem(top5Key, JSON.stringify(ids));
  };
  const saveOpps = (ids: string[]) => {
    setPinnedOppsIds(ids);
    localStorage.setItem(oppsKey, JSON.stringify(ids));
  };

  useEffect(() => {
    if (accounts.length > 0) {
      fetchInteractions().then(setAllInteractions);
    }
  }, [accounts]);

  const handleSaved = () => {
    refresh();
    fetchInteractions().then(setAllInteractions);
  };

  const openLogFor = (accountId: string) => {
    setInteractionAccountId(accountId);
    setShowInteraction(true);
  };

  // ── Derived maps ───────────────────────────────────────────────────────────
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

  // ── Pinned sections ────────────────────────────────────────────────────────
  const pinnedTop5 = useMemo(
    () => pinnedTop5Ids.map(id => accounts.find(a => a.id === id)).filter(Boolean) as Account[],
    [pinnedTop5Ids, accounts]
  );

  const pinnedOpps = useMemo(
    () => pinnedOppsIds.map(id => accounts.find(a => a.id === id)).filter(Boolean) as Account[],
    [pinnedOppsIds, accounts]
  );

  // ── Operational data ───────────────────────────────────────────────────────
  const recentInteractions = useMemo(() => allInteractions.slice(0, 5), [allInteractions]);

  const today        = new Date().toISOString().split('T')[0];
  const nextWeek     = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const pendingFU    = followUps.filter(f => f.status === 'Pending');
  const dueToday     = pendingFU.filter(f => f.dueDate <= today);
  const upcoming     = pendingFU.filter(f => f.dueDate > today && f.dueDate <= nextWeek);

  const getAccountName     = (id: string) => accounts.find(a => a.id === id)?.name     || 'Unknown';
  const getAccountCity     = (id: string) => accounts.find(a => a.id === id)?.city     || '';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';
  const getContactName     = (id: string) => contacts.find(c => c.id === id)?.name    || '';

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your territory at a glance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { setInteractionAccountId(undefined); setShowInteraction(true); }}>
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

      {/* Top 5 Accounts + Top 3 Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Top 5 Accounts */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                Top Accounts
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setEditTop5Open(true)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/accounts')}>
                  View all <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Your manually pinned priority accounts</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {pinnedTop5.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Star className="h-8 w-8 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No accounts pinned yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pin up to 5 accounts for quick access</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditTop5Open(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Select Accounts
                </Button>
              </div>
            ) : (
              pinnedTop5.map((account, idx) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted shrink-0 text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{account.name}</p>
                      <PriorityBadge tier={account.priorityTier} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{account.city}</span>
                      {account.bedCount > 0 && (
                        <span className="text-xs text-muted-foreground">· {account.bedCount} beds</span>
                      )}
                      <StrengthBadge strength={account.relationshipStrength} />
                      <DaysSinceBadge days={getDaysSince(account.id)} />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); openLogFor(account.id); }}
                  >
                    <Phone className="h-3 w-3 mr-1" /> Log
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top 3 Opportunities */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                Opportunities
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setEditOppsOpen(true)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/opportunities')}>
                  View all <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Your pinned development targets</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {pinnedOpps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No opportunities pinned yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pin up to 3 accounts to develop</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditOppsOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Select Accounts
                </Button>
              </div>
            ) : (
              pinnedOpps.map((account, idx) => (
                <div
                  key={account.id}
                  className="p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        <p className="font-medium text-sm truncate">{account.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{account.city}</span>
                        <StrengthBadge strength={account.relationshipStrength} />
                        <DaysSinceBadge days={getDaysSince(account.id)} />
                      </div>
                    </div>
                    <PriorityBadge tier={account.priorityTier} />
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => { e.stopPropagation(); openLogFor(account.id); }}
                  >
                    <Phone className="h-3 w-3 mr-1" /> Log Interaction
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentInteractions.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No interactions logged yet</p>
            )}
            {recentInteractions.map(interaction => (
              <div
                key={interaction.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${interaction.accountId}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(interaction.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {interaction.type} · {new Date(interaction.date).toLocaleDateString()}
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
              Follow-ups Due ({dueToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {dueToday.length === 0 && <p className="text-sm text-muted-foreground py-2">All caught up!</p>}
            {dueToday.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${f.accountId}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getContactName(f.contactId) || getAccountCity(f.accountId)}
                  </p>
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
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-2">No upcoming follow-ups</p>}
            {upcoming.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/accounts/${f.accountId}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Due {new Date(f.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <PriorityBadge tier={getAccountPriority(f.accountId)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pickers */}
      <AccountPickerDialog
        open={editTop5Open}
        onOpenChange={setEditTop5Open}
        title="Select Top Accounts"
        max={5}
        accounts={accounts}
        selected={pinnedTop5Ids}
        onSave={saveTop5}
      />
      <AccountPickerDialog
        open={editOppsOpen}
        onOpenChange={setEditOppsOpen}
        title="Select Opportunity Accounts"
        max={3}
        accounts={accounts}
        selected={pinnedOppsIds}
        onSave={saveOpps}
      />

      <AccountDialog open={showAccount} onOpenChange={setShowAccount} onSaved={refresh} />
      <ContactDialog open={showContact} onOpenChange={setShowContact} accounts={accounts} onSaved={refresh} />
      <InteractionDialog
        key={interactionAccountId ?? 'global'}
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
