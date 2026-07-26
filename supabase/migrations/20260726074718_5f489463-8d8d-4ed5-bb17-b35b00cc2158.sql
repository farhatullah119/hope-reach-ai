ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS user_ip text,
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz;

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages (status);