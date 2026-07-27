import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // The recovery link puts a session in place; wait for it before allowing the update
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast({ title: 'Invalid password', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', description: 'Retype the same password twice.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'Could not update password', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Password updated', description: 'You are now signed in with your new password.' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Set a new password</CardTitle>
          <CardDescription className="text-muted-foreground">
            {ready
              ? 'Choose a new password for your account'
              : 'Open this page from the reset link in your email'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={!ready || loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update password
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => navigate('/auth')}
            >
              Back to sign in
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
