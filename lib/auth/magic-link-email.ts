export const MAGIC_LINK_EMAIL_SUBJECT = "Entra in TooolVibes";
export const MAGIC_LINK_EMAIL_CTA = "Conferma e apri TooolVibes";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/>/g, "&gt;");
}

export function getMagicLinkHtml(confirmUrl: string): string {
  const safeUrl = escapeHtml(confirmUrl);

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${MAGIC_LINK_EMAIL_SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:#07060d;color:#f6f1e8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Conferma la tua email per ritrovare Salvati, confronti e decisioni nel tuo spazio.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07060d;margin:0;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#120c22;border:1px solid #2a2440;border-radius:18px;">
            <tr>
              <td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:13px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#f6f1e8;">
                      TooolVibes
                    </td>
                    <td align="right" style="font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8d86a8;line-height:1.5;">
                      Better tools<br>Brighter builders
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <h1 style="margin:0;font-size:34px;line-height:1.1;color:#ffffff;font-weight:700;letter-spacing:-0.01em;">
                  Entra in TooolVibes
                </h1>
                <p style="margin:14px 0 0;font-size:16px;line-height:1.55;color:#c9c3d9;">
                  Conferma la tua email per ritrovare Salvati, confronti e decisioni nel tuo spazio.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" bgcolor="#e4b23c" style="border-radius:10px;background:#e4b23c;">
                      <a href="${safeUrl}" style="display:inline-block;padding:15px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.2;color:#141218;text-decoration:none;">
                        ${MAGIC_LINK_EMAIL_CTA} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" style="padding-right:10px;">
                      <div style="width:34px;height:34px;border:1px solid #2a2440;border-radius:9px;text-align:center;line-height:34px;color:#b18cff;font-size:15px;">&#9679;</div>
                    </td>
                    <td style="font-size:14px;line-height:1.5;color:#c9c3d9;">
                      Questo link è valido una sola volta<br>e scade a breve.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="border-top:1px solid #2a2440;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8d86a8;">
                  Se il pulsante non funziona
                </p>
                <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#c9c3d9;">
                  Copia e incolla questo link nel tuo browser:
                </p>
                <p style="margin:0;padding:13px 14px;border:1px solid #2a2440;border-radius:10px;background:#08080a;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;word-break:break-all;color:#b18cff;">
                  ${safeUrl}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#8d86a8;">
                Se non hai richiesto tu questa email, puoi ignorarla.
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px 28px;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#f6f1e8;">
                      TooolVibes
                      <div style="margin-top:5px;font-size:10px;letter-spacing:0.14em;color:#8d86a8;text-transform:uppercase;">
                        Strumenti per chi costruisce il domani
                      </div>
                    </td>
                    <td align="right" style="font-size:12px;line-height:1.6;color:#8d86a8;">
                      tooolvibes.eu<br>
                      Il tuo spazio, idee più lontane.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export function getMagicLinkText(confirmUrl: string): string {
  return [
    "Entra in TooolVibes",
    "",
    "Conferma la tua email per ritrovare Salvati, confronti e decisioni nel tuo spazio.",
    "",
    `${MAGIC_LINK_EMAIL_CTA}:`,
    confirmUrl,
    "",
    "Questo link è valido una sola volta e scade a breve.",
    "Se il pulsante non funziona, copia e incolla il link nel browser.",
    "",
    "Se non hai richiesto tu questa email, puoi ignorarla.",
    "",
    "TOOOLVIBES",
  ].join("\n");
}
