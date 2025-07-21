'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Chatbot() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setChat([...chat, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          messages: [...chat, userMessage],
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiMessage = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })

          // Ollama streams JSON lines
          const lines = chunk.split('\n').filter(Boolean)
          for (const line of lines) {
            const json = JSON.parse(line)
            aiMessage += json.message?.content || ''
          }
        }
      }

      setChat((prev) => [...prev, { role: 'assistant', content: aiMessage }])
    } catch (err) {
      setChat((prev) => [...prev, { role: 'assistant', content: '⚠️ Error in response' }])
    }

    setLoading(false)
  }

  return (
    <Card className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardContent className="space-y-4 p-4">
        <h2 className="text-xl font-semibold">💬 Chatbot (Mistral via Ollama)</h2>
        <div className="max-h-60 overflow-y-auto space-y-2 text-sm">
          {chat.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className="inline-block px-3 py-1 rounded-md bg-white/20">
                <b>{msg.role === 'user' ? 'You' : 'Bot'}:</b> {msg.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type your message..."
            className="text-black"
          />
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
