-- Create a new public storage bucket for 'content_media'
INSERT INTO storage.buckets (id, name, public) VALUES ('content_media', 'content_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'content_media' bucket
-- Allow public access to view media
CREATE POLICY "Public media access" ON storage.objects
  FOR SELECT USING (bucket_id = 'content_media');

-- Allow authenticated users to upload their own media
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content_media');

-- Allow users to update their own media
CREATE POLICY "Users can update own media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'content_media');

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'content_media');

-- Allow admins to see who added their products to the cart
CREATE POLICY "Admins can view own product in carts" ON public.cart_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cultural_content
      WHERE cultural_content.id = cart_items.content_id
      AND cultural_content.created_by = auth.uid()
    )
  );
