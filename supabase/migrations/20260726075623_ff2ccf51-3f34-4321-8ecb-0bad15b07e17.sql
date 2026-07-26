-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'farhatullahtajak@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SHARED updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- HEALTH ARTICLES
CREATE TABLE public.health_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  language text NOT NULL DEFAULT 'en',
  image_url text,
  published boolean NOT NULL DEFAULT false,
  author_id uuid,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.health_articles TO anon, authenticated;
GRANT ALL ON public.health_articles TO service_role;
ALTER TABLE public.health_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published articles" ON public.health_articles
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins read all articles" ON public.health_articles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_health_articles_updated BEFORE UPDATE ON public.health_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HOSPITALS
CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text,
  city text,
  country text DEFAULT 'Pakistan',
  phone text,
  email text,
  website text,
  maps_url text,
  emergency_24_7 boolean NOT NULL DEFAULT false,
  opening_hours text,
  services text[],
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hospitals TO anon, authenticated;
GRANT ALL ON public.hospitals TO service_role;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads hospitals" ON public.hospitals
  FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER trg_hospitals_updated BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEDICINE REMINDERS
CREATE TABLE public.medicine_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  medicine_name text NOT NULL,
  dosage text,
  frequency text,
  times text[],
  start_date date,
  end_date date,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicine_reminders TO authenticated;
GRANT ALL ON public.medicine_reminders TO service_role;
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminders" ON public.medicine_reminders
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_medicine_reminders_updated BEFORE UPDATE ON public.medicine_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEDICAL RECORDS
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  record_type text NOT NULL DEFAULT 'other',
  details text,
  recorded_on date,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT ALL ON public.medical_records TO service_role;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own records" ON public.medical_records
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_medical_records_updated BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ADMIN AUDIT LOG
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CONTACT MESSAGES admin access
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS replied_at timestamptz;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
GRANT UPDATE, DELETE ON public.contact_messages TO authenticated;
CREATE POLICY "Admins read messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ADMIN read access for reporting
CREATE POLICY "Admins read all conversations" ON public.chat_conversations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read all chat messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read all documents" ON public.documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));