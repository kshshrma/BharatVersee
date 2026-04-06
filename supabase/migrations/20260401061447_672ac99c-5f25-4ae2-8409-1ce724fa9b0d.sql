
-- Create creator_ratings table
CREATE TABLE public.creator_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, creator_id)
);

ALTER TABLE public.creator_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON public.creator_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON public.creator_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.creator_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
