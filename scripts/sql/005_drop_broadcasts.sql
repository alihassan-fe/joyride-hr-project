-- Drop the broadcasts table and any dependent objects.
-- Do not modify previously executed migration files; add a new one instead.

BEGIN;

DROP TABLE IF EXISTS broadcasts CASCADE;

COMMIT;
