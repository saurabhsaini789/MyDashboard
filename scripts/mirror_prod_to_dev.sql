-- Mirror production dashboard_data into the local dev prefix.
--
-- What it does: copies every row whose key starts with 'my_dashboard:' into a
-- matching row prefixed 'my_dashboard_dev:' instead (same suffix, value, and
-- user_id), overwriting the dev row if one already exists for that key.
--
-- What it deliberately does NOT do:
--   - Never reads or writes anything outside the 'my_dashboard:' -> 'my_dashboard_dev:'
--     direction. It cannot touch a 'my_dashboard:' (prod) row — prod is only
--     ever the SELECT source here, never the target of the INSERT/UPDATE.
--   - No DELETE. Any 'my_dashboard_dev:*' key that doesn't have a
--     'my_dashboard:*' counterpart is left untouched (additive-only, not a
--     strict mirror) — orphaned dev-only test data survives a run of this script.
--
-- How to run: paste into the Supabase SQL editor for project
-- upkglcktwwnfieprtjws ("My Dashboard"), or ask Claude to run it via the
-- Supabase MCP tool. Safe to re-run any time you want local dev data to
-- reflect current production.

insert into public.dashboard_data (key, value, user_id, updated_at)
select
  'my_dashboard_dev:' || substring(key from length('my_dashboard:') + 1) as key,
  value,
  user_id,
  now() as updated_at
from public.dashboard_data
where key like 'my_dashboard:%'
on conflict (key) do update
set value      = excluded.value,
    user_id    = excluded.user_id,
    updated_at = excluded.updated_at
returning key, updated_at;
