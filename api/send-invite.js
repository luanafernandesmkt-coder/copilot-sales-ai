export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, password, role } = req.body || {};

    console.log('Body received:', JSON.stringify(req.body));

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Dados incompletos', received: { email, name, password } });
    }

    const roleLabel = role === 'gestor' ? 'Gestor' : 'Vendedor';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0A0810;font-family:Arial,sans-serif"><div style="max-width:520px;margin:40px auto;background:#12101C;border-radius:20px;overflow:hidden"><div style="background:linear-gradient(135deg,#73579C,#E8409A);padding:32px;text-align:center"><div style="font-size:28px;font-weight:800;color:white">Copilot Sales AI</div></div><div style="padding:32px"><div style="font-size:22px;font-weight:700;color:white;margin-bottom:8px">Olá, ${name}! 👋</div><div style="font-size:14px;color:#9090A8;line-height:1.6;margin-bottom:24px">Você foi convidado como <strong style="color:white">${roleLabel}</strong> no Copilot Sales AI.</div><div style="background:rgba(115,87,156,0.1);border:1px solid rgba(115,87,156,0.3);border-radius:12px;padding:20px;margin-bottom:24px"><div style="margin-bottom:10px"><div style="font-size:11px;color:#9090A8">Email</div><div style="font-size:15px;font-weight:600;color:white">${email}</div></div><div><div style="font-size:11px;color:#9090A8">Senha</div><div style="font-size:15px;font-weight:600;color:white">${password}</div></div></div><a href="https://copilot-sales-ai.vercel.app" style="display:block;background:linear-gradient(135deg,#73579C,#E8409A);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-size:15px;font-weight:700;">Acessar a plataforma →</a></div></div></body></html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: `Seu acesso ao Copilot Sales AI, ${name}!`,
        html
      })
    });

    const data = await response.json();
    console.log('Resend status:', response.status, JSON.stringify(data));

    if (!response.ok) return res.status(500).json({ error: data.message, details: data });
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
