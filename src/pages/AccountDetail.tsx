import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge, StrengthBadge, DaysSinceBadge, PipelineBadge } from "@/components/StatusBadges";
import { AccountDialog } from "@/components/AccountDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useAccountDetail } from "@/hooks/use-crm-data";
import { useCrmData } from "@/hooks/use-crm-data";
import { editFollowUp, removeAccount, removeContact } from "@/lib/supabase-store";
import { ArrowLeft, Edit, Trash2, Plus, Phone, Mail, MapPin, Bed, CalendarClock, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { SnoozeDialog } from "@/components/SnoozeDialog";
import { toast } from "sonner";

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, contacts, interactions, followUps, loading, refresh } = useAccountDetail(id);
  const { accounts, contacts: allContacts } = useCrmData();
  const [showEdit, setShowEdit] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!account) return <div className="p-8 text-center text-muted-foreground">Account not found</div>;

  const lastInteraction = interactions[0] || null;
  const daysSince = lastInteraction ? Math.floor((Date.now() - new Date(lastInteraction.date).getTime()) / 86400000) : null;
  const today = new Date().toISOString().split('T')[0];

  const handleDelete = async () => {
    if (confirm('Delete this account and all related data?')) {
      await removeAccount(account.id);
      toast.success('Account deleted');
      navigate('/accounts');
    }
  };

  const handleCompleteFollowUp = async (fuId: string) => {
    await editFollowUp(fuId, { status: 'Completed' });
    toast.success('Follow-up completed');
    refresh();
  };

  const handleSnoozeConfirm = async (date: string) => {
    if (!snoozeId) return;
    await editFollowUp(snoozeId, { dueDate: date });
    toast.success('Follow-up snoozed');
    setSnoozeId(null);
    refresh();
  };

  const getContactName = (cId: string) => contacts.find(c => c.id === cId)?.name || '';

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/accounts')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{account.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {account.address}, {account.city}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto shrink-0 pl-11 sm:pl-0">
          <Button size="sm" onClick={() => setShowInteraction(true)}><Phone className="mr-1.5 h-3.5 w-3.5" /> <span className="hidden sm:inline">Log</span> Interaction</Button>
          <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}><Edit className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
          <Button size="sm" variant="outline" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Details + Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Type</span>{account.accountType}</div>
              <div><span className="text-muted-foreground block text-xs">Bed Count</span><span className="flex items-center gap-1"><Bed className="h-3 w-3" />{account.bedCount}</span></div>
              <div><span className="text-muted-foreground block text-xs">Ownership</span>{account.ownership}</div>
              <div><span className="text-muted-foreground block text-xs">Organization</span>{account.organization}</div>
              <div><span className="text-muted-foreground block text-xs">ADP Volume</span>{account.adpVolume || '—'}</div>
              <div><span className="text-muted-foreground block text-xs">Account Value</span>{account.accountValue ? `$${account.accountValue.toLocaleString()}` : '—'}</div>
              <div><span className="text-muted-foreground block text-xs">Priority</span><PriorityBadge tier={account.priorityTier} /></div>
              <div><span className="text-muted-foreground block text-xs">Relationship</span><StrengthBadge strength={account.relationshipStrength} /></div>
              <div><span className="text-muted-foreground block text-xs">Pipeline Stage</span><PipelineBadge stage={account.pipelineStage} /></div>
              <div><span className="text-muted-foreground block text-xs">Account Manager</span>{account.accountManager || '—'}</div>
              <div><span className="text-muted-foreground block text-xs">Last Visit</span><DaysSinceBadge days={daysSince} /></div>
            </div>
            {account.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{account.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div>}
            {account.notes && <p className="mt-4 text-sm text-muted-foreground border-t pt-3">{account.notes}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contacts</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => { setEditingContact(null); setShowContact(true); }}><Plus className="h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts yet</p>}
            {contacts.map(c => (
              <div key={c.id} className="p-2 rounded-lg bg-muted/40 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{c.name}</p>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingContact(c.id); setShowContact(true); }}><Edit className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={async () => { await removeContact(c.id); refresh(); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{c.role}</p>
                {c.phone && <a href={`tel:${c.phone}`} className="text-xs flex items-center gap-1 mt-1 text-primary"><Phone className="h-2.5 w-2.5" />{c.phone}</a>}
                {c.email && <a href={`mailto:${c.email}`} className="text-xs flex items-center gap-1 text-primary"><Mail className="h-2.5 w-2.5" />{c.email}</a>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Follow-ups</CardTitle></CardHeader>
        <CardContent>
          {followUps.filter(f => f.status === 'Pending').length === 0 && <p className="text-sm text-muted-foreground">No pending follow-ups</p>}
          <div className="space-y-2">
            {followUps.filter(f => f.status === 'Pending').map(f => {
              const overdue = f.dueDate < today;
              const contactName = f.contactId ? getContactName(f.contactId) : null;
              return (
                <div key={f.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border ${overdue ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {overdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <span className="text-sm font-medium">{new Date(f.dueDate).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <Badge variant="outline" className="text-xs">{f.type}</Badge>
                    </div>
                    {contactName && <p className="text-xs text-muted-foreground mt-0.5">{contactName}</p>}
                    {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setSnoozeId(f.id)}><Clock className="h-3 w-3 mr-1" /> Snooze</Button>
                    <Button size="sm" onClick={() => handleCompleteFollowUp(f.id)}><CheckCircle2 className="h-3 w-3 mr-1" /> Done</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interaction History */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Interaction History</CardTitle></CardHeader>
        <CardContent>
          {interactions.length === 0 && <p className="text-sm text-muted-foreground">No interactions logged</p>}
          <div className="space-y-4">
            {interactions.map(i => {
              const contactName = i.contactId ? getContactName(i.contactId) : null;
              return (
                <div key={i.id} className="relative pl-6 pb-4 border-l-2 border-muted last:border-0 last:pb-0">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-primary" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{i.type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(i.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {contactName && <p className="text-xs text-muted-foreground">with {contactName}</p>}
                  {i.addedByName && <p className="text-xs text-muted-foreground">logged by {i.addedByName}</p>}
                  {i.notes && <p className="text-sm mt-1">{i.notes}</p>}
                  {i.outcome && <p className="text-xs text-primary mt-0.5">→ {i.outcome}</p>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SnoozeDialog open={!!snoozeId} onOpenChange={open => { if (!open) setSnoozeId(null); }} onConfirm={handleSnoozeConfirm} />
      <AccountDialog open={showEdit} onOpenChange={setShowEdit} account={account} onSaved={refresh} />
      <ContactDialog open={showContact} onOpenChange={setShowContact} contact={editingContact ? contacts.find(c => c.id === editingContact) : undefined} defaultAccountId={account.id} accounts={accounts} onSaved={refresh} />
      <InteractionDialog open={showInteraction} onOpenChange={setShowInteraction} defaultAccountId={account.id} accounts={accounts} contacts={allContacts} onSaved={refresh} />
    </div>
  );
}
