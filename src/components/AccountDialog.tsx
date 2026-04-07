import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account, AccountType, PriorityTier, RelationshipStrength } from "@/lib/types";
import { createAccount, editAccount } from "@/lib/supabase-store";
import { toast } from "sonner";

const accountTypes: AccountType[] = ['LTC', 'Retirement', 'Hospital', 'Clinic', 'Group Home'];
const priorities: PriorityTier[] = ['High', 'Medium', 'Low'];
const strengths: RelationshipStrength[] = ['Strong', 'Moderate', 'Weak', 'New'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSaved: () => void;
}

export function AccountDialog({ open, onOpenChange, account, onSaved }: Props) {
  const [form, setForm] = useState({
    name: account?.name || '',
    address: account?.address || '',
    city: account?.city || '',
    accountType: (account?.accountType || 'LTC') as AccountType,
    bedCount: account?.bedCount?.toString() || '0',
    ownership: account?.ownership || '',
    organization: account?.organization || '',
    priorityTier: (account?.priorityTier || 'Medium') as PriorityTier,
    adpVolume: account?.adpVolume?.toString() || '0',
    relationshipStrength: (account?.relationshipStrength || 'New') as RelationshipStrength,
    notes: account?.notes || '',
    tags: account?.tags?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        bedCount: parseInt(form.bedCount) || 0,
        adpVolume: parseInt(form.adpVolume) || 0,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (account) {
        await editAccount(account.id, data);
        toast.success('Account updated');
      } else {
        await createAccount(data);
        toast.success('Account created');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => update('address', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Account Type</Label>
              <Select value={form.accountType} onValueChange={v => update('accountType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{accountTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Bed Count</Label>
              <Input type="number" value={form.bedCount} onChange={e => update('bedCount', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Ownership</Label>
              <Input value={form.ownership} onChange={e => update('ownership', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Organization</Label>
              <Input value={form.organization} onChange={e => update('organization', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={form.priorityTier} onValueChange={v => update('priorityTier', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>ADP Volume</Label>
              <Input type="number" value={form.adpVolume} onChange={e => update('adpVolume', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Relationship</Label>
              <Select value={form.relationshipStrength} onValueChange={v => update('relationshipStrength', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{strengths.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="e.g. Wheelchair Program, New Build" />
          </div>
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (account ? 'Save Changes' : 'Create Account')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
