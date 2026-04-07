import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactDialog } from "@/components/ContactDialog";
import { getContacts, getAccounts, deleteContact } from "@/lib/store";
import { useStoreRefresh } from "@/hooks/use-store-refresh";
import { Plus, Search, Phone, Mail, Trash2, Edit } from "lucide-react";

export default function Contacts() {
  const refresh = useStoreRefresh();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const contacts = getContacts();
  const accounts = getAccounts();
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';

  const filtered = contacts.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    getAccountName(c.accountId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Button size="sm" onClick={() => { setEditId(null); setShowAdd(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Contact
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.role}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditId(c.id); setShowAdd(true); }}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { deleteContact(c.id); refresh(); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {c.phone && <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</p>}
              {c.email && <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</p>}
            </div>
            <p
              className="text-xs text-primary mt-2 cursor-pointer hover:underline"
              onClick={() => navigate(`/accounts/${c.accountId}`)}
            >
              {getAccountName(c.accountId)}
            </p>
          </Card>
        ))}
      </div>

      <ContactDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        contact={editId ? contacts.find(c => c.id === editId) : undefined}
        onSaved={refresh}
      />
    </div>
  );
}
