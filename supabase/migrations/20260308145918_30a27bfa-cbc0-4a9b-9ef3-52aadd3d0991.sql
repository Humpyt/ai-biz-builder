
-- Page views analytics table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  page_slug text NOT NULL DEFAULT 'index',
  visitor_ip text,
  user_agent text,
  referer text,
  country text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries by website and date
CREATE INDEX idx_page_views_website_date ON public.page_views(website_id, viewed_at DESC);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Website owners can view their own analytics
CREATE POLICY "Users can view their own page views"
  ON public.page_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

-- Service role inserts (from edge function) - no user INSERT policy needed
-- Admins can view all
CREATE POLICY "Admins can view all page views"
  ON public.page_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
