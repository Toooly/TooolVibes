export function thankYouEmail(service: string) {
  const safeService = service.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return {
    subject: "La tua idea è arrivata · TooolVibes",
    text: `TOOOLVIBES\n\nLa tua idea è arrivata.\n\nGrazie per averci raccontato cosa hai in mente. Abbiamo ricevuto la tua richiesta per: ${service}.\n\nLeggiamo ciò che ci hai scritto e ti rispondiamo a questo indirizzo per approfondire la tua idea e scegliere insieme il prossimo passo.\n\nTi è venuto in mente un altro dettaglio? Rispondi a questa email: non serve compilare di nuovo il modulo.\n\nA presto,\nIl team TooolVibes\n\nRicevi questa email perché il tuo indirizzo è stato indicato in una richiesta su progetti.tooolvibes.eu.\nPrivacy: https://progetti.tooolvibes.eu/privacy/`,
    html: `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>La tua idea è arrivata</title></head>
<body style="margin:0;padding:0;background-color:#050916;color:#f4f0e8;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Grazie per averci scritto. Ora leggiamo la tua idea e ti rispondiamo di persona.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050916"><tr><td align="center" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 8px 28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="48"><img src="https://progetti.tooolvibes.eu/assets/tooolvibes-logo.png" width="38" height="38" alt="" style="display:block;border:0"></td><td style="color:#f4f0e8;font-size:24px;font-weight:bold;letter-spacing:-1px">TooolVibes</td></tr></table></td></tr>
<tr><td bgcolor="#0b1730" style="border:1px solid #253451;border-radius:20px;overflow:hidden">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" width="50%" bgcolor="#27d8ee" style="font-size:0;line-height:3px">&nbsp;</td><td height="3" width="50%" bgcolor="#875cff" style="font-size:0;line-height:3px">&nbsp;</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 24px">
<h1 style="margin:0 0 24px;font-size:36px;line-height:1.1;letter-spacing:-1.5px;font-weight:700;color:#f4f0e8">La tua idea<br><span style="color:#27d8ee">è arrivata.</span></h1>
<p style="margin:0 0 20px;font-size:17px;line-height:1.7;color:#f4f0e8">Grazie per averci raccontato cosa hai in mente. Il tuo messaggio è arrivato al nostro team.</p>
<p style="margin:0 0 24px;padding:16px 0;border-top:1px solid #253451;border-bottom:1px solid #253451;font-size:14px;line-height:1.6;color:#aeb8cc">Il tuo punto di partenza<br><strong style="font-size:17px;color:#f4f0e8">${safeService}</strong></p>
<h2 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:#f4f0e8">Cosa succede adesso?</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#aeb8cc">Leggiamo ciò che ci hai scritto e ti rispondiamo a questo indirizzo per approfondire la tua idea e scegliere insieme il prossimo passo.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#aeb8cc"><strong style="color:#f4f0e8">Ti è venuto in mente un altro dettaglio?</strong><br>Puoi rispondere a questa email: non serve compilare di nuovo il modulo.</p>
<p style="margin:0;font-size:16px;line-height:1.7;color:#f4f0e8">A presto,<br><strong>Il team TooolVibes</strong></p>
</td></tr></table></td></tr>
<tr><td style="padding:24px 8px;font-size:12px;line-height:1.7;color:#aeb8cc">Ricevi questa email perché il tuo indirizzo è stato indicato in una richiesta su progetti.tooolvibes.eu.<br><a href="https://progetti.tooolvibes.eu/privacy/" style="color:#aeb8cc;text-decoration:underline">Informativa privacy</a></td></tr>
</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`,
  };
}
