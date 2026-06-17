# Supabase Auth email templates

These files are the branded TooolVibes copy for Supabase Auth.

Apply them in Supabase Dashboard:

1. Open Authentication > Email Templates.
2. Select Confirm signup.
3. Set the subject from `confirm-signup.subject.txt`.
4. Paste `confirm-signup.html` into the HTML template.
5. Keep `{{ .ConfirmationURL }}` unchanged so Supabase can generate the secure verification link.

The app passes the public auth callback URL from `components/account/account-provider.tsx`.

Also add the public callback to Supabase Authentication > URL Configuration > Redirect URLs:

```text
https://tooolvibes.staff-ffa.workers.dev/auth/callback
```

If you deploy on another public domain, set `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN` to that domain and add the matching `/auth/callback` URL in Supabase.
