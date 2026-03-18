export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { clientName, productName, transcript, durationMinutes, score, objections } = req.body;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Analise essa reunião de vendas e gere um relatório executivo em JSON.

Cliente: ${clientName}
Produto: ${productName}
Duração: ${durationMinutes} minutos
Score final: ${score}/100
Objeções detectadas: ${objections || 0}

Transcrição:
${transcript || 'Reunião sem transcrição gravada.'}

Responda SOMENTE em JSON válido:
{
  "resumo": "2-3 frases resumindo como foi a reunião",
  "proximos_passos": ["passo 1", "passo 2", "passo 3"]
}`
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
    console.error('Report error:', error);
    return res.status(500).json({ error: error.message });
  }
}
