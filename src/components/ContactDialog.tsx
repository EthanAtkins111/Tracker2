import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Account, Contact } from "@/lib/types";
import { createContact, editContact } from "@/lib/supabase-store";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = ['OT', 'PT', 'Nurse Manager', 'Director of Care', 'General Manager', 'Physician', 'Physiatrist', 'Administrator', 'Other'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  defaultAccountId?: string;
  accounts: Account[];
  onSaved: () => void;
}

export function ContactDialog({ open, onOpenChange, contact, defaultAccountId, accounts, onSaved }: Props) {
  const [form, setForm] = useState({
    name: contact?.name || '',
    role: contact?.role || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    accountId: contact?.accountId || defaultAccountId || '',
    notes: contact?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const selectedAccountName = useMemo(
    () => accounts.find(a => a.id === form.accountId)?.name || '',
    [accounts, form.accountId]
  );

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.accountId) { toast.error('Please select an account'); return; }
    setSaving(true);
    try {
      if (contact) {
        await editContact(contact.id, form);
        toast.success('Contact updated');
      } else {
        await createContact(form);
        toast.success('Contact added');
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Account</Label>
            <Popover open={accountOpen} onOpenChange={setAccountOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={accountOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedAccountName || "Search accounts..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search accounts..." />
                  <CommandList>
                    <CommandEmpty>No accounts found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      {accounts.map(a => (
                        <CommandItem
                          key={a.id}
                          value={a.name}
                          onSelect={() => {
                            update('accountId', a.id);
                            setAccountOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.accountId === a.id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{a.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{a.city}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">{saving ? 'Saving...' : (contact ? 'Save' : 'Add Contact')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
