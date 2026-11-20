// The password-reset e-mail (Arabic, right-to-left). Table layout + inline styles only, so Gmail (web / Android / iOS)
// and small screens show it the same way. Colours: navy #153448, teal #168C91, white #FFFFFF, light grey #F1F4F6.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function resetEmail(code, { siteUrl = 'https://nursehubegypt.com' } = {}) {
  const otp = esc(code);
  const subject = 'NurseHub Egypt — Password Reset';
  const text = [
    'NurseHub Egypt — Password Reset',
    '',
    'مرحبًا بك في NurseHub Egypt.',
    'تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.',
    '',
    `رمز التحقق الخاص بك: ${code}`,
    '',
    'هذا الرمز صالح لمدة 10 دقائق، ويستخدم مرة واحدة فقط.',
    'إذا لم تطلب إعادة تعيين كلمة المرور، فتجاهل هذه الرسالة ولا تشارك الرمز مع أي شخص.',
    '',
    'NurseHub Egypt',
    'كل ما يحتاجه الممرض في مكان واحد.',
    siteUrl,
  ].join('\n');

  const font = "font-family:Tahoma,'Segoe UI',Arial,sans-serif;";
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>NurseHub Egypt — Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F4F6;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#F1F4F6;">رمز التحقق لإعادة تعيين كلمة المرور صالح لمدة 10 دقائق.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F4F6;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
      <tr><td align="center" style="background-color:#153448;padding:26px 20px;">
        <div style="${font}font-size:22px;line-height:28px;font-weight:bold;color:#FFFFFF;" dir="ltr">NurseHub <span style="color:#5FD3D8;">Egypt</span></div>
        <div style="${font}font-size:13px;line-height:20px;color:#C9D6DF;margin-top:4px;" dir="ltr">Password Reset</div>
      </td></tr>
      <tr><td dir="rtl" align="right" style="padding:28px 28px 8px 28px;${font}font-size:16px;line-height:28px;color:#153448;text-align:right;">
        <p style="margin:0 0 10px 0;font-weight:bold;font-size:18px;">مرحبًا بك في NurseHub Egypt.</p>
        <p style="margin:0 0 18px 0;">تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
        <p style="margin:0 0 10px 0;">رمز التحقق الخاص بك:</p>
      </td></tr>
      <tr><td align="center" style="padding:0 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td align="center" dir="ltr" style="background-color:#F1F4F6;border:2px solid #168C91;border-radius:12px;padding:14px 22px;font-family:'Courier New',Courier,monospace;font-size:34px;line-height:40px;font-weight:bold;letter-spacing:8px;color:#153448;">${otp}</td></tr>
        </table>
      </td></tr>
      <tr><td dir="rtl" align="right" style="padding:20px 28px 8px 28px;${font}font-size:15px;line-height:26px;color:#153448;text-align:right;">
        <p style="margin:0 0 12px 0;">هذا الرمز صالح لمدة <strong style="color:#168C91;">10 دقائق</strong>، ويستخدم مرة واحدة فقط.</p>
        <p style="margin:0 0 6px 0;padding:12px 14px;background-color:#F1F4F6;border-right:4px solid #168C91;border-radius:8px;font-size:14px;line-height:24px;">إذا لم تطلب إعادة تعيين كلمة المرور، فتجاهل هذه الرسالة ولا تشارك الرمز مع أي شخص.</p>
      </td></tr>
      <tr><td align="center" style="padding:22px 20px 26px 20px;border-top:1px solid #E3E9ED;">
        <div style="${font}font-size:14px;line-height:22px;font-weight:bold;color:#168C91;" dir="ltr">NurseHub Egypt</div>
        <div style="${font}font-size:13px;line-height:22px;color:#5B7083;" dir="rtl">كل ما يحتاجه الممرض في مكان واحد.</div>
        <div style="${font}font-size:12px;line-height:20px;margin-top:6px;" dir="ltr"><a href="${esc(siteUrl)}" style="color:#168C91;text-decoration:none;">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a></div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  return { subject, text, html };
}
