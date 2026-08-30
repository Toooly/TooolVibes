-- H7: first-class dismissed report status.
-- Additive. Does not rewrite tables or drop data.

alter table public.community_experience_reports
  drop constraint if exists community_experience_reports_status_chk;

alter table public.community_experience_reports
  add constraint community_experience_reports_status_chk
  check (status in ('open', 'resolved', 'dismissed'));
