import "server-only";

const fallbackSiteUrl = "https://tooolvibes.com";

function getBaseSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl).replace(/\/+$/, "");
}

export function normalizeReferralCode(value: string) {
  return value.trim().replace(/\s+/g, "-");
}

export function isValidReferralCode(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,47}$/.test(value);
}

export function getAffiliateReferralUrl(referralCode: string) {
  const code = normalizeReferralCode(referralCode);
  return `${getBaseSiteUrl()}/affiliati?ref=${encodeURIComponent(code)}`;
}

export function getAffiliateQrCodeUrl(referralUrl: string, size = 260) {
  const normalizedSize = Math.min(Math.max(size, 120), 640);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${normalizedSize}x${normalizedSize}&data=${encodeURIComponent(referralUrl)}`;
}
