import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { USER_ROLES } from '@/lib/types';
import { toast } from 'sonner';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupStoreCode, setSignupStoreCode] = useState('');
  const [signupRole, setSignupRole] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) { toast.error('Passwords do not match'); return; }
    if (signupPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (!signupFirstName.trim() || !signupLastName.trim()) { toast.error('First and last name are required'); return; }
    if (!signupStoreCode.trim()) { toast.error('Store code is required'); return; }
    if (!signupRole) { toast.error('Please select your role'); return; }
    setLoading(true);
    const fullName = `${signupFirstName.trim()} ${signupLastName.trim()}`;
    const { error } = await signUp(signupEmail, signupPassword, signupStoreCode, fullName, signupRole);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to confirm, then sign in.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <span className="text-primary-foreground font-bold text-lg">HC</span>
          </div>
          <CardTitle className="text-xl">Motion Health CRM</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to manage your territory</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input type="text" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input type="text" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Store Code</Label>
                  <Input
                    type="text"
                    placeholder="e.g. OW-STC"
                    value={signupStoreCode}
                    onChange={e => setSignupStoreCode(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter the store code provided by your manager.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={signupRole} onValueChange={setSignupRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
