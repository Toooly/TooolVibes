export function thankYouEmail(service: string) {
  const safeService = service.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return {
    subject: "La tua richiesta è arrivata. Partiamo da qui.",
    text: `TOOOLVIBES\n\nIl primo passo è fatto.\n\nGrazie per averci scritto. Abbiamo ricevuto la tua richiesta per: ${service}.\n\nOra la leggiamo con attenzione. Ti risponderemo a questa email per approfondire il progetto e capire insieme da dove partire.\n\nHai un dettaglio da aggiungere? Rispondi direttamente a questo messaggio: non serve compilare di nuovo il modulo.\n\nA presto,\nIl team TooolVibes\n\nRicevi questa conferma perché è stata inviata una richiesta con questo indirizzo su servizi.tooolvibes.eu.\nPrivacy: https://servizi.tooolvibes.eu/privacy/`,
    html: `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>La tua richiesta è arrivata</title></head>
<body style="margin:0;padding:0;background-color:#050916;color:#f4f0e8;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Abbiamo ricevuto il tuo messaggio. Il prossimo passo è parlarne.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050916"><tr><td align="center" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 8px 28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="48"><img src="https://servizi.tooolvibes.eu/assets/tooolvibes-logo.png" width="38" height="38" alt="" style="display:block;border:0"></td><td style="color:#f4f0e8;font-size:24px;font-weight:bold;letter-spacing:-1px">TooolVibes</td></tr></table></td></tr>
<tr><td bgcolor="#0b1730" style="border:1px solid #253451;border-radius:20px;overflow:hidden">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" width="50%" bgcolor="#27d8ee" style="font-size:0;line-height:3px">&nbsp;</td><td height="3" width="50%" bgcolor="#875cff" style="font-size:0;line-height:3px">&nbsp;</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 24px">
<h1 style="margin:0 0 24px;font-size:36px;line-height:1.1;letter-spacing:-1.5px;font-weight:700;color:#f4f0e8">Il primo passo<br><span style="color:#27d8ee">è fatto.</span></h1>
<p style="margin:0 0 20px;font-size:17px;line-height:1.7;color:#f4f0e8">Grazie per averci scritto. Abbiamo ricevuto la tua richiesta.</p>
<p style="margin:0 0 24px;padding:16px 0;border-top:1px solid #253451;border-bottom:1px solid #253451;font-size:14px;line-height:1.6;color:#aeb8cc">Da dove partiamo<br><strong style="font-size:17px;color:#f4f0e8">${safeService}</strong></p>
<h2 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:#f4f0e8">E adesso?</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#aeb8cc">Leggiamo la tua richiesta con attenzione. Ti risponderemo a questa email per approfondire il progetto e capire insieme da dove partire.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#aeb8cc"><strong style="color:#f4f0e8">Hai un dettaglio da aggiungere?</strong><br>Rispondi direttamente a questo messaggio: non serve compilare di nuovo il modulo.</p>
<p style="margin:0;font-size:16px;line-height:1.7;color:#f4f0e8">A presto,<br><strong>Il team TooolVibes</strong></p>
</td></tr></table></td></tr>
<tr><td style="padding:24px 8px;font-size:12px;line-height:1.7;color:#aeb8cc">Ricevi questa conferma perché è stata inviata una richiesta con questo indirizzo su servizi.tooolvibes.eu.<br><a href="https://servizi.tooolvibes.eu/privacy/" style="color:#aeb8cc;text-decoration:underline">Informativa privacy</a></td></tr>
</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`,
  };
}
