// src/pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Only POST supported')

  const { message } = req.body

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: message,
        stream: false,
      }),
    })

    const data = await response.json()
    return res.status(200).json({ response: data.response })
  } catch (error) {
    console.error('Ollama error:', error)
    return res.status(500).json({ error: 'Chatbot failed to respond' })
  }
}
