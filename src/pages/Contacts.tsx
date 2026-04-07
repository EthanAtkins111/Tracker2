import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactDialog } from "@/components/ContactDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import { removeContact } from "@/lib/supabase-store";
import { Plus, Search, Phone, Mail, Trash2, Edit, Building2 } from "lucide-react";

export default function Contacts() {
  const { accounts, contacts, loading, refresh, getAccountName } = useCrmData();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const filtered = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()) || getAccountName(c.accountId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Contacts</h1>
        <Button size="sm" className="w-full sm:w-auto" onClick={() => { setEditId(null); setShowAdd(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Contact
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No contacts found</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(c => (
          <Card key={c.id} className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.role}</p>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditId(c.id); setShowAdd(true); }}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await removeContact(c.id); refresh(); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {c.phone && (
                <a href={`tel:${c.phone}`} className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3 w-3 shrink-0" /><span className="truncate">{c.phone}</span>
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3 w-3 shrink-0" /><span className="truncate">{c.email}</span>
                </a>
              )}
            </div>
            <p
              className="text-xs text-primary mt-2 cursor-pointer hover:underline flex items-center gap-1 truncate"
              onClick={() => navigate(`/accounts/${c.accountId}`)}
            >
              <Building2 className="h-3 w-3 shrink-0" />
              {getAccountName(c.accountId)}
            </p>
          </Card>
        ))}
      </div>
      <ContactDialog open={showAdd} onOpenChange={setShowAdd} contact={editId ? contacts.find(c => c.id === editId) : undefined} accounts={accounts} onSaved={refresh} />
    </div>
  );
}
