
-- Website pages table for multi-page support
CREATE TABLE public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  slug text NOT NULL DEFAULT 'index',
  title text NOT NULL DEFAULT 'Home',
  generated_html text,
  generated_css text,
  generated_js text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(website_id, slug)
);

ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage pages of their own websites
CREATE POLICY "Users can view their own website pages"
  ON public.website_pages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can insert pages for their own websites"
  ON public.website_pages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can update their own website pages"
  ON public.website_pages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can delete their own website pages"
  ON public.website_pages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can view all website pages"
  ON public.website_pages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all website pages"
  ON public.website_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Version history table
CREATE TABLE public.website_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  generated_html text,
  generated_css text,
  generated_js text,
  pages jsonb,
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(website_id, version_number)
);

ALTER TABLE public.website_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own website versions"
  ON public.website_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

CREATE POLICY "Users can insert versions for their own websites"
  ON public.website_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_id AND w.user_id = auth.uid()));

CREATE POLICY "Admins can view all website versions"
  ON public.website_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger for website_pages
CREATE TRIGGER update_website_pages_updated_at
  BEFORE UPDATE ON public.website_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for generated website images
INSERT INTO storage.buckets (id, name, public) VALUES ('website-images', 'website-images', true);

-- Storage policies for website-images bucket
CREATE POLICY "Anyone can view website images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'website-images');

CREATE POLICY "Service role can upload website images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'website-images');
