# Supabase Auth email templates

These files are the branded TooolVibes copy for Supabase Auth.

Apply them in Supabase Dashboard:

1. Open Authentication > Email Templates.
2. Select Magic Link / OTP.
3. Set the subject from `magic-link.subject.txt`.
4. Paste `magic-link.html` into the HTML template.
5. Repeat the same process for Confirm signup with `confirm-signup.subject.txt` and `confirm-signup.html`.
6. Keep this callback shape unchanged so the app can verify the one-time token:

```html
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

The app passes the public auth callback URL from `components/account/account-provider.tsx`.

Also add the public callback to Supabase Authentication > URL Configuration > Redirect URLs:

```text
https://tooolvibes.eu/auth/callback
```

If you deploy on another public domain, set `NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN` to that domain and add the matching `/auth/callback` URL in Supabase.
