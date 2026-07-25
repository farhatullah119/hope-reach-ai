
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read own submissions" ON public.contact_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Chat conversations
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.chat_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX chat_messages_conv_idx ON public.chat_messages(conversation_id, created_at);

-- Documents (stored analysis metadata)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT,
  summary TEXT,
  key_info TEXT,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents" ON public.documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Resources (public directory)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  country TEXT,
  city TEXT,
  contact TEXT,
  website TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read resources" ON public.resources FOR SELECT TO anon, authenticated USING (true);

-- Seed resources
INSERT INTO public.resources (category, name, description, country, city, contact, website, tags) VALUES
('ngo', 'UNHCR Pakistan', 'UN Refugee Agency providing protection and assistance to refugees.', 'Pakistan', 'Islamabad', '+92-51-2829-502', 'https://www.unhcr.org/pk/', ARRAY['refugee','protection','documentation']),
('ngo', 'UNHCR Afghanistan', 'UN Refugee Agency support for IDPs and returnees.', 'Afghanistan', 'Kabul', '+93-799-100-100', 'https://www.unhcr.org/af/', ARRAY['refugee','idp']),
('ngo', 'International Rescue Committee', 'Humanitarian aid, health, education, and protection services.', 'Pakistan', 'Peshawar', 'info@rescue.org', 'https://www.rescue.org', ARRAY['aid','health','education']),
('ngo', 'Islamic Relief Pakistan', 'Emergency relief and development programs.', 'Pakistan', 'Islamabad', '+92-51-111-473-573', 'https://islamic-relief.org.pk', ARRAY['aid','relief']),
('ngo', 'SHARP Pakistan', 'Society for Human Rights and Prisoners'' Aid - legal aid for refugees.', 'Pakistan', 'Islamabad', '+92-51-2856727', 'https://sharp-pakistan.org', ARRAY['legal','rights']),
('scholarship', 'DAFI Scholarship (UNHCR)', 'Higher education scholarship for refugees worldwide.', 'Global', NULL, NULL, 'https://www.unhcr.org/dafi-scholarships.html', ARRAY['university','higher-education']),
('scholarship', 'HEC Pakistan Scholarships', 'Higher Education Commission scholarships including for Afghan students.', 'Pakistan', 'Islamabad', NULL, 'https://www.hec.gov.pk/scholarships', ARRAY['university','pakistan']),
('scholarship', 'Chevening Scholarships', 'UK government funded scholarships for future leaders.', 'UK', NULL, NULL, 'https://www.chevening.org', ARRAY['masters','uk']),
('scholarship', 'DAAD Scholarships', 'German Academic Exchange Service scholarships.', 'Germany', NULL, NULL, 'https://www.daad.de', ARRAY['germany','masters']),
('scholarship', 'Fulbright Program', 'US government sponsored scholarships and exchange.', 'USA', NULL, NULL, 'https://foreign.fulbrightonline.org', ARRAY['usa','masters']),
('health', 'MSF Pakistan (Doctors Without Borders)', 'Free medical care in vulnerable regions.', 'Pakistan', 'Peshawar', NULL, 'https://www.msf.org/pakistan', ARRAY['health','clinic','free']),
('health', 'Basic Health Units - Afghan Refugee Villages', 'Primary healthcare in refugee villages.', 'Pakistan', 'Khyber Pakhtunkhwa', NULL, NULL, ARRAY['clinic','primary-care']),
('health', 'Marie Stopes Society', 'Reproductive and maternal health services.', 'Pakistan', 'Nationwide', '+92-21-111-111-796', 'https://mariestopespk.org', ARRAY['women','maternal']),
('legal', 'Refugee Affected and Hosting Areas Programme', 'Legal advice and documentation support.', 'Pakistan', 'Islamabad', NULL, NULL, ARRAY['legal','documentation']),
('legal', 'AGHS Legal Aid Cell', 'Free legal aid for vulnerable communities.', 'Pakistan', 'Lahore', '+92-42-3576-4326', 'https://aghslaw.net', ARRAY['legal','free']),
('education', 'Aga Khan Education Services', 'Schools and educational programs.', 'Pakistan', 'Nationwide', NULL, 'https://www.akesp.org', ARRAY['school','education']),
('education', 'Coursera for Refugees', 'Free access to Coursera courses.', 'Global', NULL, NULL, 'https://www.coursera.org/refugees', ARRAY['online','free','university']),
('education', 'Khan Academy', 'Free world-class education for anyone.', 'Global', NULL, NULL, 'https://www.khanacademy.org', ARRAY['online','free','k-12']),
('emergency', 'Rescue 1122', 'Pakistan emergency services (ambulance, fire, rescue).', 'Pakistan', 'Nationwide', '1122', NULL, ARRAY['emergency','ambulance']),
('emergency', 'Edhi Foundation', '24/7 ambulance and emergency welfare services.', 'Pakistan', 'Nationwide', '115', 'https://edhi.org', ARRAY['emergency','ambulance','welfare']),
('emergency', 'Afghanistan Red Crescent', 'Emergency response and humanitarian assistance.', 'Afghanistan', 'Kabul', '+93-20-2500-524', NULL, ARRAY['emergency','red-cross']),
('employment', 'ILO Refugee Employment Programs', 'Job placement and skills training for refugees.', 'Global', NULL, NULL, 'https://www.ilo.org/global/topics/labour-migration', ARRAY['jobs','training']),
('employment', 'Rozee.pk', 'Largest job portal in Pakistan.', 'Pakistan', 'Nationwide', NULL, 'https://www.rozee.pk', ARRAY['jobs','portal']),
('government', 'NADRA Pakistan', 'National Database and Registration Authority.', 'Pakistan', 'Nationwide', '051-111-786-100', 'https://www.nadra.gov.pk', ARRAY['documentation','id']),
('government', 'Commissionerate for Afghan Refugees', 'Government agency managing Afghan refugee affairs.', 'Pakistan', 'Peshawar', NULL, NULL, ARRAY['refugee','documentation']);
