import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact } from "@/lib/types";
import { getAccounts, saveContact, updateContact } from "@/lib/store";
import { toast } from "sonner";

const roles = ['OT', 'PT', 'Nurse Manager', 'Director of Care', 'General Manager', 'Physician', 'Physiatrist', 'Administrator', 'Other'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  defaultAccountId?: string;
  onSaved: () => void;
}

export function ContactDialog({ open, onOpenChange, contact, defaultAccountId, onSaved }: Props) {
  const accounts = getAccounts();
  const [form, setForm] = useState({
    name: contact?.name || '',
    role: contact?.role || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    accountId: contact?.accountId || defaultAccountId || '',
    notes: contact?.notes || '',
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.accountId) { toast.error('Please select an account'); return; }
    if (contact) {
      updateContact(contact.id, form);
      toast.success('Contact updated');
    } else {
      saveContact(form);
      toast.success('Contact added');
    }
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={v => update('role', v)}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Account</Label>
            <Select value={form.accountId} onValueChange={v => update('accountId', v)}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{contact ? 'Save' : 'Add Contact'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
