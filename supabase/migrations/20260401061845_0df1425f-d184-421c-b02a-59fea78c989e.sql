
CREATE POLICY "Creators can view their subscribers" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = creator_id);
