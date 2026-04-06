-- 1. Add 'role' to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role app_role NOT NULL DEFAULT 'user';

-- 2. Migrate existing user roles to profiles
UPDATE public.profiles
SET role = r.role
FROM public.user_roles r
WHERE public.profiles.user_id = r.user_id;

-- 3. Replace handle_new_user_profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role, assigned_state)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'selected_role'))::app_role, 'user'),
    NEW.raw_user_meta_data->>'assigned_state'
  );
  RETURN NEW;
END;
$$;

-- 4. Update the has_role function to check profiles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Drop old user_roles table and its trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();
DROP TABLE IF EXISTS public.user_roles;
