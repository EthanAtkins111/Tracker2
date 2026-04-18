import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Building2, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AccountResult { id: string; name: string; city: string; account_type: string; }
interface ContactResult { id: string; name: string; role: string; account_id: string; account_name?: string; }

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<AccountResult[]>([]);
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setAccounts([]); setContacts([]); return; }
    const pattern = `%${q}%`;
    const [{ data: accs }, { data: cons }] = await Promise.all([
      supabase.from('accounts').select('id, name, city, account_type').ilike('name', pattern).limit(6),
      supabase.from('contacts').select('id, name, role, account_id').ilike('name', pattern).limit(6),
    ]);
    setAccounts((accs as AccountResult[]) || []);

    const rawContacts = (cons as ContactResult[]) || [];
    if (rawContacts.length > 0) {
      const accountIds = [...new Set(rawContacts.map(c => c.account_id))];
      const { data: relatedAccs } = await supabase.from('accounts').select('id, name').in('id', accountIds);
      const accMap: Record<string, string> = {};
      (relatedAccs || []).forEach((a: { id: string; name: string }) => { accMap[a.id] = a.name; });
      setContacts(rawContacts.map(c => ({ ...c, account_name: accMap[c.account_id] || '' })));
    } else {
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-48 sm:w-64 justify-start text-muted-foreground font-normal text-xs gap-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        Search accounts, contacts...
        <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
          <span>⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={open => { setOpen(open); if (!open) setQuery(''); }}>
        <DialogContent className="p-0 max-w-lg overflow-hidden">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search accounts and contacts..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-80">
              {query.trim() && accounts.length === 0 && contacts.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              {accounts.length > 0 && (
                <CommandGroup heading="Accounts">
                  {accounts.map(a => (
                    <CommandItem key={a.id} value={a.id} onSelect={() => go(`/accounts/${a.id}`)}>
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">{a.city} · {a.account_type}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {contacts.length > 0 && (
                <CommandGroup heading="Contacts">
                  {contacts.map(c => (
                    <CommandItem key={c.id} value={c.id} onSelect={() => go(`/accounts/${c.account_id}`)}>
                      <Users className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">{c.role}{c.account_name && ` · ${c.account_name}`}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
