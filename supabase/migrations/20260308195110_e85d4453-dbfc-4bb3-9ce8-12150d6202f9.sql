ALTER TABLE public.profiles ADD COLUMN banned boolean NOT NULL DEFAULT false;

-- Allow admins to update all profiles (for banning)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));