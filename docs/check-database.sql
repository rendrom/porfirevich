-- Read-only migration verification. Run with psql -X -qAt -v ON_ERROR_STOP=1.
-- Compare outputs only while application writes are stopped on both databases.
-- No story contents, email addresses or password hashes are printed.
SET TIME ZONE 'UTC';
SET extra_float_digits = 3;
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT format(
  'SELECT %L, count(*), md5(coalesce(string_agg(h, '''' ORDER BY h COLLATE "C"), '''')) FROM (SELECT md5(to_jsonb(t)::text) h FROM %I.%I t) rows',
  'table:' || schemaname || '.' || tablename, schemaname, tablename
)
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename COLLATE "C"
\gexec
SELECT format('SELECT %L, last_value, is_called FROM %I.%I',
  'sequence:' || schemaname || '.' || sequencename, schemaname, sequencename)
FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename COLLATE "C"
\gexec
SELECT 'index', indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' ORDER BY indexname COLLATE "C";
SELECT 'constraint', conrelid::regclass, conname, pg_get_constraintdef(oid), convalidated
FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND contype <> 'n'
ORDER BY conname COLLATE "C";
SELECT 'extension', extname, extversion FROM pg_extension ORDER BY extname COLLATE "C";
COMMIT;
