export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { speech, clientName, productName, context, history } = req.body;

    if (!speech) return res.status(400).json({ error: 'No speech provided' });

    const historyText = (history || [])
      .slice(-6)
      .map(h => `${h.role === 'cliente' ? 'Cliente' : 'IA'}: ${h.text}`)
      .join('\n');

    const system = `Você é um copiloto de vendas em tempo real. Analise o que o cliente disse e gere uma sugestão imediata para o vendedor responder.

CONTEXTO DA VENDA:
- Cliente/Empresa: ${clientName || 'não informado'}
- Produto: ${productName || 'não informado'}
- Contexto adicional: ${context || 'não informado'}

INSTRUÇÕES:
1. Detecte se o cliente levantou uma objeção, demonstrou interesse ou fez pergunta
2. Gere UMA sugestão clara e direta de como o vendedor deve responder agora
3. Liste 2-3 pontos de apoio rápidos
4. Classifique o sinal: OBJECAO, COMPRA ou NEUTRO
5. Dê scores de 0-100 para: empatia, clareza, argum, fecha

Responda SOMENTE em JSON válido:
{
  "sinal": "OBJECAO" | "COMPRA" | "NEUTRO",
  "sugestao": "texto da sugestão para o vendedor falar agora",
  "pontos": ["ponto 1", "ponto 2", "ponto 3"],
  "alerta": "texto curto do alerta",
  "scores": { "empatia": 0-100, "clareza": 0-100, "argum": 0-100, "fecha": 0-100 }
}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system,
        messages: [{
          role: 'user',
          content: `Histórico recente:\n${historyText}\n\nCliente acabou de dizer:\n"${speech}"\n\nGere a sugestão agora.`
        }]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(claudeRes.status).json({ error: err });
    }

    const data = await claudeRes.json();
    const raw = data.content[0].text.trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Suggest error:', error);
    return res.status(500).json({ error: error.message });
  }
}
