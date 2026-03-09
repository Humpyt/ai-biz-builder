
-- Admin notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'new_signup' or 'subscription_change'
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow triggers to insert (via security definer function)
CREATE OR REPLACE FUNCTION public.create_admin_notification(
  _type text,
  _title text,
  _message text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata)
  VALUES (_type, _title, _message, _metadata);
END;
$$;

-- Trigger function for new user signups (fires on profiles insert)
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_signup',
    'New User Signed Up',
    'A new user has registered (ID: ' || NEW.user_id::text || ')',
    jsonb_build_object('user_id', NEW.user_id, 'display_name', COALESCE(NEW.display_name, 'Unknown'))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile_notify
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_new_signup();

-- Trigger function for subscription changes
CREATE OR REPLACE FUNCTION public.notify_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _message text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _title := 'New Subscription';
    _message := 'User ' || NEW.user_id::text || ' subscribed to ' || NEW.plan || ' plan';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    _title := 'Subscription Status Changed';
    _message := 'User ' || NEW.user_id::text || ' subscription changed from ' || OLD.status || ' to ' || NEW.status;
  ELSIF TG_OP = 'UPDATE' AND OLD.plan IS DISTINCT FROM NEW.plan THEN
    _title := 'Subscription Plan Changed';
    _message := 'User ' || NEW.user_id::text || ' changed plan from ' || OLD.plan || ' to ' || NEW.plan;
  ELSE
    RETURN NEW;
  END IF;

  PERFORM create_admin_notification(
    'subscription_change',
    _title,
    _message,
    jsonb_build_object('user_id', NEW.user_id, 'plan', NEW.plan, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_subscription_change_notify
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.notify_subscription_change();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
