-- Preserve historical bookings and make them visible in client profiles.
INSERT INTO clients (name, phone, email)
SELECT DISTINCT ON (regexp_replace(client_phone, '[^0-9]', '', 'g'))
  client_name, regexp_replace(client_phone, '[^0-9]', '', 'g'), client_email
FROM appointments
WHERE client_id IS NULL AND regexp_replace(client_phone, '[^0-9]', '', 'g') <> ''
ORDER BY regexp_replace(client_phone, '[^0-9]', '', 'g'), appointment_date DESC, id DESC
ON CONFLICT ((regexp_replace(phone, '[^0-9]', '', 'g'))) DO NOTHING;
UPDATE appointments a SET client_id = c.id
FROM clients c
WHERE a.client_id IS NULL AND regexp_replace(a.client_phone, '[^0-9]', '', 'g') = regexp_replace(c.phone, '[^0-9]', '', 'g');
