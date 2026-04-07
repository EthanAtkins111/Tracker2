import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriorityBadge } from "@/components/StatusBadges";
import { getFollowUps, getAccounts, getContacts, updateFollowUp } from "@/lib/store";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function FollowUps() {
  const refresh = useStoreRefresh();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');

  const followUps = getFollowUps();
  const accounts = getAccounts();
  const contacts = getContacts();
  const today = new Date().toISOString().split('T')[0];

  const filtered = followUps
    .filter(f => tab === 'pending' ? f.status === 'Pending' : f.status === 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getAccountCity = (id: string) => accounts.find(a => a.id === id)?.city || '';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';
  const getContactName = (id: string) => contacts.find(c => c.id === id)?.name || '';

  const handleComplete = (id: string) => { updateFollowUp(id, { status: 'Completed' }); toast.success('Done'); refresh(); };
  const handleSnooze = (id: string) => {
    const d = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    updateFollowUp(id, { dueDate: d }); toast.success('Snoozed 1 week'); refresh();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Follow-ups</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({followUps.filter(f => f.status === 'Pending').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">{tab === 'pending' ? 'No pending follow-ups' : 'No completed follow-ups'}</p>}
        {filtered.map(f => {
          const overdue = f.status === 'Pending' && f.dueDate < today;
          return (
            <Card key={f.id} className={`p-4 ${overdue ? 'border-destructive/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div
                  className="min-w-0 cursor-pointer"
                  onClick={() => navigate(`/accounts/${f.accountId}`)}
                >
                  <div className="flex items-center gap-2">
                    {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                    <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                    <PriorityBadge tier={getAccountPriority(f.accountId)} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getAccountCity(f.accountId)}
                    {getContactName(f.contactId) && ` · ${getContactName(f.contactId)}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(f.dueDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <Badge variant="outline" className="text-xs">{f.type}</Badge>
                    {f.notes && <span className="text-xs text-muted-foreground">· {f.notes}</span>}
                  </div>
                </div>
                {f.status === 'Pending' && (
                  <div className="flex gap-1.5 shrink-0 ml-2">
                    <Button size="sm" variant="outline" onClick={() => handleSnooze(f.id)}>
                      <Clock className="h-3 w-3 mr-1" /> Snooze
                    </Button>
                    <Button size="sm" onClick={() => handleComplete(f.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
