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
  <body style="margin:0;padding:0;background:#08080a;color:#f4f0e7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Conferma la tua email per ritrovare Salvati, confronti e decisioni nel tuo spazio.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#08080a;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#08080a;">
            <tr>
              <td style="padding:8px 8px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#f4f0e7;">
                TooolVibes
              </td>
            </tr>
            <tr>
              <td style="padding:0 8px 8px;font-family:Arial,Helvetica,sans-serif;">
                <h1 style="margin:0;font-size:28px;line-height:1.15;color:#fffdf8;font-weight:700;">
                  Entra in TooolVibes
                </h1>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#c2beb5;">
                  Conferma la tua email per ritrovare Salvati, confronti e decisioni nel tuo spazio.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" bgcolor="#c9a227" style="border-radius:8px;background:#c9a227;">
                      <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.2;color:#08080a;text-decoration:none;">
                        ${MAGIC_LINK_EMAIL_CTA}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#8d8981;">
                <p style="margin:0;">Questo link è valido una sola volta e scade a breve.</p>
                <p style="margin:14px 0 0;">Se il pulsante non funziona, copia e incolla questo link nel browser:</p>
                <p style="margin:10px 0 0;word-break:break-all;color:#c2beb5;">${safeUrl}</p>
                <p style="margin:18px 0 0;">Se non hai richiesto tu questa email, puoi ignorarla.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 8px 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#55524d;">
                TOOOLVIBES
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
