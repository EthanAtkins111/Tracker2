import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
            <Clock className="h-7 w-7 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Your account (<span className="font-medium text-foreground">{user?.email}</span>) has been created successfully, but requires admin approval before you can access the system.
          </p>
          <p className="text-muted-foreground text-sm">
            You'll be able to sign in once an administrator approves your account.
          </p>
          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
