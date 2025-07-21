// pages/api/ollama-chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { message } = req.body

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        messages: [{ role: 'user', content: message }],
        stream: false
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).send(text)
    }

    const data = await response.json()
    return res.status(200).json({ reply: data.message.content })
  } catch (err) {
    console.error('Error talking to Mistral via Ollama:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
