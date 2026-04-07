import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriorityBadge, StrengthBadge, DaysSinceBadge } from "@/components/StatusBadges";
import { AccountDialog } from "@/components/AccountDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import { fetchLastInteraction, fetchFollowUpsByAccount } from "@/lib/supabase-store";
import { AccountType, PriorityTier, RelationshipStrength, Interaction, FollowUp } from "@/lib/types";
import { Plus, Search, Building2, Bed } from "lucide-react";

const tabTypes: { label: string; value: AccountType | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'LTC', value: 'LTC' },
  { label: 'Retirement', value: 'Retirement' },
  { label: 'Hospital', value: 'Hospital' },
  { label: 'Clinic', value: 'Clinic' },
  { label: 'Group Home', value: 'Group Home' },
];

export default function Accounts() {
  const { accounts, loading, refresh } = useCrmData();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [strengthFilter, setStrengthFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState('All');
  const [lastInteractions, setLastInteractions] = useState<Record<string, Interaction | null>>({});
  const [nextFollowUps, setNextFollowUps] = useState<Record<string, FollowUp | null>>({});

  useEffect(() => {
    if (accounts.length > 0) {
      Promise.all(accounts.map(a => fetchLastInteraction(a.id).then(i => [a.id, i] as const)))
        .then(results => {
          const map: Record<string, Interaction | null> = {};
          results.forEach(([id, i]) => { map[id] = i; });
          setLastInteractions(map);
        });
      Promise.all(accounts.map(a => fetchFollowUpsByAccount(a.id).then(fus => [a.id, fus.find(f => f.status === 'Pending') || null] as const)))
        .then(results => {
          const map: Record<string, FollowUp | null> = {};
          results.forEach(([id, f]) => { map[id] = f; });
          setNextFollowUps(map);
        });
    }
  }, [accounts]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const cities = [...new Set(accounts.map(a => a.city))].sort();

  const getDaysSince = (accountId: string): number | null => {
    const last = lastInteractions[accountId];
    if (!last) return null;
    return Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
  };

  const filtered = accounts
    .filter(a => activeTab === 'All' || a.accountType === activeTab)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()))
    .filter(a => cityFilter === 'all' || a.city === cityFilter)
    .filter(a => priorityFilter === 'all' || a.priorityTier === priorityFilter)
    .filter(a => strengthFilter === 'all' || a.relationshipStrength === strengthFilter)
    .sort((a, b) => {
      if (sortBy === 'beds') return b.bedCount - a.bedCount;
      if (sortBy === 'interaction') {
        const aLast = lastInteractions[a.id];
        const bLast = lastInteractions[b.id];
        return (aLast ? new Date(aLast.date).getTime() : 0) - (bLast ? new Date(bLast.date).getTime() : 0);
      }
      if (sortBy === 'followup') {
        const aNext = nextFollowUps[a.id];
        const bNext = nextFollowUps[b.id];
        return (aNext ? new Date(aNext.dueDate).getTime() : Infinity) - (bNext ? new Date(bNext.dueDate).getTime() : Infinity);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Account
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>{tabTypes.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}</TabsList>
      </Tabs>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Cities</SelectItem>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Priority</SelectItem>{(['High', 'Medium', 'Low'] as PriorityTier[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={strengthFilter} onValueChange={setStrengthFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Strength" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Strength</SelectItem>{(['Strong', 'Moderate', 'Weak', 'New'] as RelationshipStrength[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="beds">Bed Count</SelectItem>
            <SelectItem value="interaction">Last Interaction</SelectItem>
            <SelectItem value="followup">Follow-up Urgency</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No accounts found</p>}
        {filtered.map(account => {
          const nextFu = nextFollowUps[account.id];
          return (
            <Card key={account.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/accounts/${account.id}`)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.city} · {account.accountType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {account.bedCount > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Bed className="h-3 w-3" /> {account.bedCount}</span>}
                  <PriorityBadge tier={account.priorityTier} />
                  <StrengthBadge strength={account.relationshipStrength} />
                  <div className="text-right">
                    <DaysSinceBadge days={getDaysSince(account.id)} />
                    {nextFu && <p className="text-xs text-muted-foreground">Next: {new Date(nextFu.dueDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</p>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <AccountDialog open={showAdd} onOpenChange={setShowAdd} onSaved={refresh} />
    </div>
  );
}
