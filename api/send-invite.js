export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, password, role } = req.body;
  if (!email || !name || !password) return res.status(400).json({ error: 'Dados incompletos' });

  const roleLabel = role === 'gestor' ? 'Gestor' : 'Vendedor';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0A0810;font-family:Arial,sans-serif"><div style="max-width:520px;margin:40px auto;background:#12101C;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden"><div style="background:linear-gradient(135deg,#73579C,#E8409A);padding:32px;text-align:center"><div style="font-size:28px;font-weight:800;color:white">Copilot Sales AI</div><div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:6px">Powered by LuLab Creative Marketing</div></div><div style="padding:32px"><div style="font-size:22px;font-weight:700;color:white;margin-bottom:8px">Olá, ${name}! 👋</div><div style="font-size:14px;color:#9090A8;line-height:1.6;margin-bottom:24px">Você foi convidado para acessar o <strong style="color:#9B7EC8">Copilot Sales AI</strong> como <strong style="color:white">${roleLabel}</strong>.</div><div style="background:rgba(115,87,156,0.1);border:1px solid rgba(115,87,156,0.3);border-radius:12px;padding:20px;margin-bottom:24px"><div style="font-size:11px;font-weight:600;color:#9B7EC8;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Suas credenciais de acesso</div><div style="margin-bottom:10px"><div style="font-size:11px;color:#9090A8;margin-bottom:3px">Email</div><div style="font-size:15px;font-weight:600;color:white">${email}</div></div><div><div style="font-size:11px;color:#9090A8;margin-bottom:3px">Senha</div><div style="font-size:15px;font-weight:600;color:white">${password}</div></div></div><a href="https://copilot-sales-ai.vercel.app" style="display:block;background:linear-gradient(135deg,#73579C,#E8409A);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-size:15px;font-weight:700;margin-bottom:24px">Acessar a plataforma →</a></div><div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center"><div style="font-size:12px;color:#555">LuLab Creative Marketing · Copilot Sales AI</div></div></div></body></html>`;

  try {
    console.log('Sending email to:', email);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Copilot Sales AI <onboarding@resend.dev>',
        to: [email],
        subject: `Seu acesso ao Copilot Sales AI está pronto, ${name}!`,
        html
      })
    });

    const data = await response.json();
    console.log('Resend status:', response.status);
    console.log('Resend response:', JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Erro ao enviar email', details: data });
    }

    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('Send invite error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
