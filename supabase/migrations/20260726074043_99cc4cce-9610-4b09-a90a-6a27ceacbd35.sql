CREATE TABLE public.vocabulary_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  main_lang TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, source)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocabulary_sets TO authenticated;
GRANT ALL ON public.vocabulary_sets TO service_role;

ALTER TABLE public.vocabulary_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vocabulary sets"
  ON public.vocabulary_sets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vocabulary sets"
  ON public.vocabulary_sets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary sets"
  ON public.vocabulary_sets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary sets"
  ON public.vocabulary_sets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vocabulary_sets_updated_at
BEFORE UPDATE ON public.vocabulary_sets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();