import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Account, Contact, InteractionType } from "@/lib/types";
import { createInteraction, createFollowUp } from "@/lib/supabase-store";
import { toast } from "sonner";

const interactionTypes: InteractionType[] = ['Visit', 'Call', 'Email', 'Demo', 'Service Follow-up'];
const followUpOptions = [
  { label: '1 Week', days: 7 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: 'Custom', days: 0 },
  { label: 'None', days: -1 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAccountId?: string;
  defaultContactId?: string;
  accounts: Account[];
  contacts: Contact[];
  onSaved: () => void;
}

export function InteractionDialog({ open, onOpenChange, defaultAccountId, defaultContactId, accounts, contacts: allContacts, onSaved }: Props) {
  const [accountId, setAccountId] = useState(defaultAccountId || '');
  const [contactId, setContactId] = useState(defaultContactId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<InteractionType>('Visit');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followUpChoice, setFollowUpChoice] = useState('None');
  const [customDate, setCustomDate] = useState('');
  const [saving, setSaving] = useState(false);

  const contacts = accountId ? allContacts.filter(c => c.accountId === accountId) : [];

  const handleSave = async () => {
    if (!accountId) { toast.error('Select an account'); return; }
    setSaving(true);
    try {
      await createInteraction({ date, accountId, contactId, type, notes, outcome });

      const option = followUpOptions.find(o => o.label === followUpChoice);
      if (option && option.days >= 0) {
        let dueDate: string;
        if (option.days === 0) {
          if (!customDate) { toast.error('Set a custom follow-up date'); setSaving(false); return; }
          dueDate = customDate;
        } else {
          const d = new Date();
          d.setDate(d.getDate() + option.days);
          dueDate = d.toISOString().split('T')[0];
        }
        await createFollowUp({ accountId, contactId, dueDate, type: followUpChoice, status: 'Pending', notes: '' });
        toast.success('Interaction logged with follow-up scheduled');
      } else {
        toast.success('Interaction logged');
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to log interaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => setType(v as InteractionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{interactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={v => { setAccountId(v); setContactId(''); }}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {contacts.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.role}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-1.5">
            <Label>Outcome</Label>
            <Input value={outcome} onChange={e => setOutcome(e.target.value)} />
          </div>
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Schedule Follow-up</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {followUpOptions.map(o => (
                <Button key={o.label} type="button" size="sm" variant={followUpChoice === o.label ? 'default' : 'outline'} onClick={() => setFollowUpChoice(o.label)}>
                  {o.label}
                </Button>
              ))}
            </div>
            {followUpChoice === 'Custom' && (
              <Input type="date" className="mt-2" value={customDate} onChange={e => setCustomDate(e.target.value)} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Log Interaction'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
