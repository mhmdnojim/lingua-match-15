import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_MONTHLY_LIMIT = 300;

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export interface PremiumVoiceUsage {
  used: number;
  limit: number;
  signedIn: boolean;
  loading: boolean;
}

/** Tracks how many premium voice requests the signed-in user made this month */
export function usePremiumVoiceUsage() {
  const [usage, setUsage] = useState<PremiumVoiceUsage>({
    used: 0,
    limit: DEFAULT_MONTHLY_LIMIT,
    signedIn: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUsage({ used: 0, limit: DEFAULT_MONTHLY_LIMIT, signedIn: false, loading: false });
      return;
    }

    const [{ count }, { data: limitRow }] = await Promise.all([
      supabase
        .from('premium_voice_usage')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStartIso()),
      supabase.from('premium_voice_limits').select('monthly_limit').maybeSingle(),
    ]);

    setUsage({
      used: count ?? 0,
      limit: limitRow?.monthly_limit ?? DEFAULT_MONTHLY_LIMIT,
      signedIn: true,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  /** Optimistic local bump after a successful premium call */
  const setCounts = useCallback((used: number, limit: number) => {
    setUsage((prev) => ({ ...prev, used, limit, loading: false }));
  }, []);

  return { ...usage, refresh, setCounts };
}
