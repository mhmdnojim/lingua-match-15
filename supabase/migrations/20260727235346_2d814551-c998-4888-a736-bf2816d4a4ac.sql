CREATE TABLE public.premium_voice_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language text,
  chars integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_voice_usage TO authenticated;
GRANT ALL ON public.premium_voice_usage TO service_role;

ALTER TABLE public.premium_voice_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own premium voice usage"
  ON public.premium_voice_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX premium_voice_usage_user_created_idx
  ON public.premium_voice_usage (user_id, created_at DESC);

CREATE TABLE public.premium_voice_limits (
  user_id uuid PRIMARY KEY,
  monthly_limit integer NOT NULL DEFAULT 300,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_voice_limits TO authenticated;
GRANT ALL ON public.premium_voice_limits TO service_role;

ALTER TABLE public.premium_voice_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own premium voice limit"
  ON public.premium_voice_limits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_premium_voice_limits_updated_at
  BEFORE UPDATE ON public.premium_voice_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();