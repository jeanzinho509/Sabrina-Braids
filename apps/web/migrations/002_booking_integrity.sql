-- Existing duplicates or overlapping bookings intentionally stop this migration.
-- Reconcile the reported rows before retrying; never delete live data automatically.
CREATE UNIQUE INDEX IF NOT EXISTS clients_normalized_phone_idx ON clients ((regexp_replace(phone, '[^0-9]', '', 'g')));
CREATE UNIQUE INDEX IF NOT EXISTS financial_appointment_once_idx ON financial_transactions(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointments ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
  tsrange(appointment_date + start_time, appointment_date + end_time, '[)') WITH &&
) WHERE (status IN ('pending', 'confirmed', 'completed'));

CREATE OR REPLACE FUNCTION guard_salon_schedule() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE day DATE; begins TIME; finishes TIME;
BEGIN
  IF TG_TABLE_NAME = 'appointments' THEN
    IF NEW.status NOT IN ('pending', 'confirmed', 'completed') THEN RETURN NEW; END IF;
    day := NEW.appointment_date; begins := NEW.start_time; finishes := NEW.end_time;
  ELSE
    day := NEW.block_date; begins := NEW.start_time; finishes := NEW.end_time;
  END IF;
  IF finishes <= begins THEN RAISE EXCEPTION 'Invalid time interval' USING ERRCODE = '22007'; END IF;
  -- Both kinds of reservation use the same transaction lock for the salon date.
  PERFORM pg_advisory_xact_lock(82491, day - DATE '2000-01-01');
  IF TG_TABLE_NAME = 'appointments' THEN
    IF EXISTS (SELECT 1 FROM time_blocks WHERE block_date = day AND start_time < finishes AND end_time > begins) THEN
      RAISE EXCEPTION 'Time is blocked' USING ERRCODE = '23P01';
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM appointments WHERE appointment_date = day AND status IN ('pending', 'confirmed', 'completed') AND start_time < finishes AND end_time > begins)
       OR EXISTS (SELECT 1 FROM time_blocks WHERE block_date = day AND id <> NEW.id AND start_time < finishes AND end_time > begins) THEN
      RAISE EXCEPTION 'Time is occupied' USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_schedule_guard BEFORE INSERT OR UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION guard_salon_schedule();
CREATE TRIGGER time_blocks_schedule_guard BEFORE INSERT OR UPDATE ON time_blocks FOR EACH ROW EXECUTE FUNCTION guard_salon_schedule();
