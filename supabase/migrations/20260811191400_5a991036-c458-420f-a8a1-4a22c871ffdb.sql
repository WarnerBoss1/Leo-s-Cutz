CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  service TEXT NOT NULL DEFAULT 'Haircut',
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT appointments_status_check CHECK (status IN ('pending','confirmed','cancelled')),
  CONSTRAINT appointments_unique_slot UNIQUE (appointment_date, appointment_time)
);

GRANT INSERT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request an appointment"
  ON public.appointments FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

CREATE POLICY "Signed in owners can view appointments"
  ON public.appointments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Signed in owners can update appointments"
  ON public.appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Signed in owners can delete appointments"
  ON public.appointments FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.booked_slots(from_date DATE, to_date DATE)
RETURNS TABLE (appointment_date DATE, appointment_time TIME)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.appointment_date, a.appointment_time
  FROM public.appointments a
  WHERE a.appointment_date BETWEEN from_date AND to_date
    AND a.status <> 'cancelled';
$$;

GRANT EXECUTE ON FUNCTION public.booked_slots(DATE, DATE) TO anon, authenticated;