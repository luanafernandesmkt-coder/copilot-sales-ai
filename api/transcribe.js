export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const boundary = req.headers['content-type'].split('boundary=')[1];
    const body = buffer.toString('binary');
    const parts = body.split('--' + boundary);

    let audioBuffer = null;
    let filename = 'audio.webm';

    for (const part of parts) {
      if (part.includes('name="file"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const headerSection = part.substring(0, headerEnd);
          const filenameMatch = headerSection.match(/filename="([^"]+)"/);
          if (filenameMatch) filename = filenameMatch[1];
          const binaryData = part.substring(headerEnd + 4, part.lastIndexOf('\r\n'));
          audioBuffer = Buffer.from(binaryData, 'binary');
        }
      }
    }

    if (!audioBuffer) return res.status(400).json({ error: 'No audio file found' });

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      return res.status(whisperRes.status).json({ error: err });
    }

    const data = await whisperRes.json();
    return res.status(200).json({ text: data.text });

  } catch (error) {
    console.error('Transcribe error:', error);
    return res.status(500).json({ error: error.message });
  }
}
