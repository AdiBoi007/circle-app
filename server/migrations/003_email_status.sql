-- Provider acceptance is distinct from inbox delivery. A webhook integration would be
-- needed to claim delivered/bounced status; the beta currently records provider acceptance.
ALTER TABLE circle_outbox DROP CONSTRAINT IF EXISTS circle_outbox_status_check;
UPDATE circle_outbox SET status='Sent' WHERE status='Delivered';
ALTER TABLE circle_outbox ADD CONSTRAINT circle_outbox_status_check CHECK(status IN ('Pending','Sent','Failed'));
