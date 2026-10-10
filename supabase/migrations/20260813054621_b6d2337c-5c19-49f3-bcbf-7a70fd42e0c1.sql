ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_unique_slot;
ALTER TABLE public.appointments ALTER COLUMN appointment_date DROP NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN appointment_time DROP NOT NULL;
DROP FUNCTION IF EXISTS public.booked_slots(date, date);