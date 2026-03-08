
-- Drop all restrictive policies and recreate as permissive

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- websites
DROP POLICY IF EXISTS "Admins can delete all websites" ON public.websites;
DROP POLICY IF EXISTS "Admins can update all websites" ON public.websites;
DROP POLICY IF EXISTS "Admins can view all websites" ON public.websites;
DROP POLICY IF EXISTS "Users can create their own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can delete their own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can update their own websites" ON public.websites;
DROP POLICY IF EXISTS "Users can view their own websites" ON public.websites;

CREATE POLICY "Users can view their own websites" ON public.websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all websites" ON public.websites FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their own websites" ON public.websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own websites" ON public.websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all websites" ON public.websites FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own websites" ON public.websites FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete all websites" ON public.websites FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
