DROP POLICY IF EXISTS "Authenticated users can read own viewer profile" ON public.viewer_profiles;
CREATE POLICY "Authenticated users can read own viewer profile"
ON public.viewer_profiles
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can manage own viewer workspace" ON public.viewer_workspaces;
CREATE POLICY "Authenticated users can manage own viewer workspace"
ON public.viewer_workspaces
FOR ALL
TO authenticated
USING (
  viewer_id IN (
    SELECT id
    FROM public.viewer_profiles
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  viewer_id IN (
    SELECT id
    FROM public.viewer_profiles
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can manage own viewer tool states" ON public.viewer_tool_states;
CREATE POLICY "Authenticated users can manage own viewer tool states"
ON public.viewer_tool_states
FOR ALL
TO authenticated
USING (
  viewer_id IN (
    SELECT id
    FROM public.viewer_profiles
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  viewer_id IN (
    SELECT id
    FROM public.viewer_profiles
    WHERE auth_user_id = auth.uid()
  )
);
