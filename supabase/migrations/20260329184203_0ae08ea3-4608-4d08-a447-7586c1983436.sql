CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_unique ON public.user_roles (user_id);

DO $$ BEGIN
  ALTER TABLE public.cart_items
    ADD CONSTRAINT cart_items_content_id_fkey
    FOREIGN KEY (content_id) REFERENCES public.cultural_content(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;