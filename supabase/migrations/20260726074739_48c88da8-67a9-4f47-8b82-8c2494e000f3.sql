DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon;
REVOKE INSERT ON public.contact_messages FROM authenticated;
GRANT ALL ON public.contact_messages TO service_role;