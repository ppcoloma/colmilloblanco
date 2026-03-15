export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { messages, system, imageData } = req.body;

    let userContent;
    if (imageData) {
      userContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageData.type,
            data: imageData.b64
          }
        },
        {
          type: 'text',
          text: 'Analiza este perro en detalle: 1) Raza probable o mezcla de razas (sé específico, si es mestizo di qué razas podrían ser). 2) Tamaño aproximado. 3) Una característica de personalidad típica de esa raza. Responde en español chileno, máximo 3 oraciones amigables. Al final pregunta cómo se llama el perro.'
        }
      ];
    } else {
      userContent = messages[messages.length - 1].content;
    }

    const payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: system,
      messages: imageData
        ? [{ role: 'user', content: userContent }]
        : messages
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error de API' });
    }

    return res.status(200).json({ reply: data.content?.[0]?.text || null });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
