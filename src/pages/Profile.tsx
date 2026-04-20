import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ROLES = ['Sales', 'Manager', 'Service', 'Retail', 'Technician'] as const;

export default function Profile() {
  const { user, storeCode, isAdmin, role, fullName } = useAuth();

  const [firstName, setFirstName] = useState(() => fullName ? fullName.split(' ')[0] : '');
  const [lastName, setLastName] = useState(() => fullName ? fullName.split(' ').slice(1).join(' ') : '');
  const [selectedRole, setSelectedRole] = useState(role || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) {
      toast.error('First and last name are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: `${trimmedFirst} ${trimmedLast}`,
        role: selectedRole || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Profile updated');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-lg">
      <h1 className="text-xl sm:text-2xl font-bold">My Account</h1>

      <Card className="p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <p className="text-sm font-medium">{user?.email}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Store Code</Label>
          <p className="text-sm font-mono font-medium">{storeCode || '—'}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Account Type</Label>
          <div className="flex gap-2">
            {isAdmin && <Badge>Admin</Badge>}
            <Badge variant="secondary">Approved</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role" className="max-w-xs">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
    </div>
  );
}
