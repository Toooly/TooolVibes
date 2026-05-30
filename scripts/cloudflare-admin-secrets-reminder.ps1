# Cloudflare Admin Secrets Reminder
# Run this locally when you are about to do a deploy.
# It does NOT set any secrets (for security), it just reminds you what to do.

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Yellow
Write-Host "  TOOOLVIBES - CLOUDFLARE SECRETS REMINDER" -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "PROBLEM: If you only add secrets in the normal Worker 'Variables and Secrets'," -ForegroundColor Red
Write-Host "         they will DISAPPEAR on the next Git build / npm run deploy." -ForegroundColor Red
Write-Host ""
Write-Host "CORRECT ACTION:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to Cloudflare Dashboard → Workers & Pages → tooolvibes"
Write-Host "2. Click on 'Builds' (or Deployments → Builds)"
Write-Host "3. Select the Build Configuration linked to your Git repo"
Write-Host "4. Add / update these as SECRETS inside 'Build variables and secrets':"
Write-Host ""
Write-Host "   - TOOOLVIBES_ADMIN_EMAIL"
Write-Host "   - TOOOLVIBES_ADMIN_PASSWORD_HASH   (the real \$2b\$10\$... value)"
Write-Host "   - TOOOLVIBES_ADMIN_PASSWORD        (plain: TooolDemo2026$)"
Write-Host "   - TOOOLVIBES_SESSION_SECRET"
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY"
Write-Host ""
Write-Host "5. Also add them in the normal Worker Settings → Variables and Secrets (as backup)"
Write-Host ""
Write-Host "6. Then run a new deploy: npm run deploy"
Write-Host ""
Write-Host "After doing this correctly, new Git builds should keep the secrets."
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Yellow
Write-Host ""