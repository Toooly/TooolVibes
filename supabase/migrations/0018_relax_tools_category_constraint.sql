alter table public.tools
drop constraint if exists tools_category_allowed_check;

alter table public.tools
add constraint tools_category_allowed_check
check (char_length(trim(category)) >= 2);

notify pgrst, 'reload schema';
