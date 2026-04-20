import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Shield, ShieldOff, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  is_admin: boolean;
  store_code: string;
  created_at: string;
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setLoading(false);
    if (error) { toast.error('Failed to load users: ' + error.message); return; }
    setProfiles(data || []);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) { toast.error('Failed to update: ' + error.message); return; }
    toast.success('User updated');
    fetchProfiles();
  };

  const removeUser = async (profile: Profile) => {
    const name = profile.full_name || profile.email;
    if (!window.confirm(`Remove ${name}? They will be deleted and can sign up again if needed.`)) return;
    setDeleting(profile.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('delete_user', { user_id: profile.id });
    setDeleting(null);
    if (error) { toast.error('Failed to remove user: ' + error.message); return; }
    toast.success(`${name} has been removed`);
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const pending  = profiles.filter(p => !p.approved);
  const approved = profiles.filter(p => p.approved);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-amber-600">Pending Approval ({pending.length})</h2>
          {pending.map(p => (
            <Card key={p.id} className="p-3 sm:p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  {p.full_name && <p className="font-medium text-sm">{p.full_name}</p>}
                  <p className="text-sm truncate text-muted-foreground">{p.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.role && <span className="mr-2">{p.role}</span>}
                    Store: {p.store_code || '—'} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => updateProfile(p.id, { approved: true })}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleting === p.id}
                    onClick={() => removeUser(p)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {deleting === p.id ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold">Approved Users ({approved.length})</h2>
        {approved.map(p => (
          <Card key={p.id} className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="min-w-0">
                  {p.full_name && <p className="font-medium text-sm">{p.full_name}</p>}
                  <p className="text-sm truncate text-muted-foreground">{p.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.role && <span className="mr-2">{p.role}</span>}
                    Store: {p.store_code || '—'} · Since {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                {p.is_admin && <Badge variant="default" className="text-xs shrink-0 mt-0.5">Admin</Badge>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProfile(p.id, { is_admin: !p.is_admin })}
                >
                  {p.is_admin
                    ? <><ShieldOff className="mr-1 h-3.5 w-3.5" /> Remove Admin</>
                    : <><Shield className="mr-1 h-3.5 w-3.5" /> Make Admin</>}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleting === p.id}
                  onClick={() => removeUser(p)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  {deleting === p.id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {approved.length === 0 && (
          <p className="text-sm text-muted-foreground">No approved users yet.</p>
        )}
      </div>
    </div>
  );
}
