export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      type,
      personaName,
      personaDesc,
      companyName,
      companySector,
      companyProducts,
      companyObjections,
      history,
      vendedorResponse
    } = req.body;

    const productsCtx = companyProducts?.length 
      ? `Produtos que o vendedor vende: ${companyProducts.join(', ')}` : '';
    const objectionsCtx = companyObjections?.length 
      ? `Objeções típicas desse mercado: ${companyObjections.join(', ')}` : '';

    const prompt = type === 'opening'
      ? `Você é um cliente simulado com o perfil: ${personaName}.
Descrição: ${personaDesc}

CONTEXTO DA EMPRESA QUE ESTÁ SENDO VENDIDA:
- Empresa: ${companyName || 'não informado'}
- Setor: ${companySector || 'não informado'}
${productsCtx}

Inicie a conversa de vendas com uma frase realista e desafiadora para esse perfil.
Seja específico ao setor e produtos da empresa.
Máximo 2 frases. Responda APENAS a fala do cliente, sem aspas, sem explicações.`

      : `Você é um cliente simulado com o perfil: ${personaName}.
Descrição: ${personaDesc}

CONTEXTO DA EMPRESA QUE ESTÁ SENDO VENDIDA:
- Empresa: ${companyName || 'não informado'}
- Setor: ${companySector || 'não informado'}
${productsCtx}
${objectionsCtx}

HISTÓRICO:
${history || ''}

O vendedor acabou de dizer: "${vendedorResponse}"

Reaja de forma realista e desafiadora para esse perfil.
Use objeções reais e específicas desse mercado/produto.
Máximo 2 frases. Responda APENAS a fala do cliente, sem aspas, sem explicações.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(claudeRes.status).json({ error: err });
    }

    const data = await claudeRes.json();
    const message = data.content[0].text.trim();

    return res.status(200).json({ message });

  } catch (error) {
    console.error('Sim message error:', error);
    return res.status(500).json({ error: error.message });
  }
}
