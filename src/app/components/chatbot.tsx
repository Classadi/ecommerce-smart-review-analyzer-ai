'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function Chatbot() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)
    setMessages((prev) => [...prev, { from: 'user', text: input }])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { from: 'bot', text: data.response }])
      setInput('')
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: '⚠️ Error in response' }])
    }
    setLoading(false)
  }

  return (
    <div className="mt-10 p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <h2 className="text-xl font-bold mb-2 text-yellow-400">💬 Chatbot (Mistral via Ollama)</h2>
      <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[90%] ${
              msg.from === 'user'
                ? 'bg-yellow-500 text-black self-end ml-auto'
                : 'bg-gray-800 text-white self-start'
            }`}
          >
            <strong>{msg.from === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <Textarea
        placeholder="Ask something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="bg-gray-800 text-white border-yellow-500"
      />
      <Button className="mt-2 bg-yellow-400 text-black hover:bg-yellow-500" onClick={sendMessage} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </Button>
    </div>
  )
}
