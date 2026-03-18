export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, role, company_id } = req.body || {};

  if (!email || !password || !name || !company_id) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const supabaseUrl = 'https://koaesjjxmibetscjwfrn.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY não configurada' });
  }

  try {
    // Step 1: Create user with Admin API
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      return res.status(400).json({ error: createData.message || 'Erro ao criar usuário' });
    }

    const userId = createData.id;

    // Step 2: Create profile
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: userId,
        full_name: name,
        role: role,
        company_id: company_id
      })
    });

    if (!profileRes.ok) {
      const profileErr = await profileRes.text();
      return res.status(400).json({ error: 'Usuário criado mas erro no perfil: ' + profileErr });
    }

    return res.status(200).json({ success: true, id: userId });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
