export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { 
      speech, 
      clientName, 
      productName, 
      context, 
      history,
      companyProducts,
      companyObjections,
      companyTone,
      companyName,
      companySector
    } = req.body;

    if (!speech) return res.status(400).json({ error: 'No speech provided' });

    const historyText = (history || [])
      .slice(-8)
      .map(h => `${h.role === 'cliente' ? 'CLIENTE' : 'VENDEDOR'}: ${h.text}`)
      .join('\n');

    const productsContext = companyProducts?.length 
      ? `Produtos/serviços que vendemos: ${companyProducts.join(', ')}` 
      : '';
    
    const objectionsContext = companyObjections?.length 
      ? `Objeções comuns nesse mercado: ${companyObjections.join(', ')}` 
      : '';

    const toneMap = {
      'profissional': 'formal, técnico e objetivo',
      'consultivo': 'consultivo, empático e estratégico', 
      'agressivo': 'direto, assertivo e focado em fechamento',
      'educativo': 'didático, paciente e informativo'
    };
    const toneContext = toneMap[companyTone] || 'profissional e consultivo';

    const system = `Você é um copiloto de vendas de elite, especializado em sugestões em tempo real durante reuniões comerciais.

EMPRESA DO VENDEDOR:
- Empresa: ${companyName || 'não informado'}
- Setor: ${companySector || 'não informado'}
- Tom de comunicação: ${toneContext}
${productsContext}
${objectionsContext}

REUNIÃO ATUAL:
- Cliente/Prospect: ${clientName || 'não informado'}
- Produto em foco: ${productName || 'não informado'}
- Contexto adicional: ${context || 'nenhum'}

SEU PAPEL:
1. Analise EXATAMENTE o que o cliente disse — palavra por palavra
2. Identifique a intenção real por trás da fala (objeção, dúvida, interesse, resistência, sinal de compra)
3. Gere uma sugestão de resposta ESPECÍFICA para esse momento, usando o tom da empresa
4. A sugestão deve ser natural, humana e conversacional — não robótica
5. Use os produtos e objeções comuns da empresa para contextualizar a resposta
6. Detecte padrões de comportamento do cliente ao longo do histórico

REGRAS:
- Nunca ignore o que o cliente disse para dar uma resposta genérica
- Se o cliente mencionou um concorrente, trate diretamente
- Se o cliente levantou preço, responda com valor, não com desconto imediato
- Se o cliente está indeciso, crie urgência real
- Se o cliente demonstrou interesse, avance para próximo passo

Responda SOMENTE em JSON válido sem nenhum texto extra:
{
  "sinal": "OBJECAO" | "COMPRA" | "NEUTRO" | "URGENCIA" | "DUVIDA",
  "sugestao": "resposta natural e específica para o vendedor falar agora (máximo 3 frases)",
  "pontos": ["argumento de apoio 1", "argumento de apoio 2", "argumento de apoio 3"],
  "alerta": "insight rápido sobre o momento da venda",
  "scores": {
    "empatia": 0-100,
    "clareza": 0-100,
    "argum": 0-100,
    "fecha": 0-100
  }
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
        max_tokens: 800,
        system,
        messages: [{
          role: 'user',
          content: `HISTÓRICO DA CONVERSA:\n${historyText || 'Início da reunião'}\n\nO CLIENTE ACABOU DE DIZER:\n"${speech}"\n\nGere a sugestão agora.`
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
