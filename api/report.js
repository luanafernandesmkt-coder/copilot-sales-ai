export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      clientName, productName, transcript, durationMinutes, score, objections,
      companyName, companySector, companyProducts, companyObjections, companyTone
    } = req.body;

    const productsContext = companyProducts?.length 
      ? `Produtos da empresa: ${companyProducts.join(', ')}` : '';
    
    const objectionsContext = companyObjections?.length 
      ? `Objeções comuns: ${companyObjections.join(', ')}` : '';

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Você é um analista de vendas especialista. Analise esta reunião e gere um relatório executivo preciso.

CONTEXTO DA EMPRESA:
- Empresa vendedora: ${companyName || 'não informado'}
- Setor: ${companySector || 'não informado'}
${productsContext}
${objectionsContext}

DADOS DA REUNIÃO:
- Cliente/Prospect: ${clientName}
- Produto discutido: ${productName}
- Duração: ${durationMinutes} minutos
- Score final: ${score}/100
- Objeções detectadas: ${objections || 0}

TRANSCRIÇÃO COMPLETA:
${transcript || 'Reunião sem transcrição gravada.'}

Analise profundamente a transcrição e responda SOMENTE em JSON válido:
{
  "resumo": "análise executiva de 3-4 frases: como foi a reunião, qual foi o nível de interesse do cliente, quais foram os momentos críticos",
  "proximos_passos": [
    "próximo passo específico e acionável 1",
    "próximo passo específico e acionável 2", 
    "próximo passo específico e acionável 3"
  ]
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
