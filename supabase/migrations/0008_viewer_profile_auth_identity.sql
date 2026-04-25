create unique index if not exists viewer_profiles_auth_user_idx
on public.viewer_profiles (auth_user_id)
where auth_user_id is not null;
