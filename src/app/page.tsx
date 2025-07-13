'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

export default function Page() {
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const handleSubmit = async () => {
    if (!review.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  // Dynamic color for emotions
  const getEmotionColor = (emotion: string) => {
    const map: Record<string, string> = {
      joy: 'bg-yellow-400',
      anger: 'bg-red-500',
      fear: 'bg-purple-600',
      sadness: 'bg-blue-500',
      trust: 'bg-green-500',
      surprise: 'bg-pink-500',
      anticipation: 'bg-orange-400',
      disgust: 'bg-gray-500',
    }
    return map[emotion.toLowerCase()] || 'bg-white'
  }

  // Dynamic color for toxicity types
  const getToxicityColor = (type: string) => {
    const map: Record<string, string> = {
      toxic: 'bg-red-600',
      severe_toxic: 'bg-red-800',
      obscene: 'bg-orange-500',
      threat: 'bg-purple-700',
      insult: 'bg-pink-600',
      identity_hate: 'bg-yellow-600',
    }
    return map[type.toLowerCase()] || 'bg-white'
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-6">
          🛍️ Flipkart Review Analyzer
        </h1>

        <Textarea
          className="min-h-[140px] bg-gray-800 text-white border-yellow-500 mb-4 focus-visible:ring-yellow-400"
          placeholder="Paste your product review here..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <Button
          className="bg-yellow-400 text-black hover:bg-yellow-500 transition"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Review'}
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-gray-900 text-white mt-8 shadow-lg border border-gray-700">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-semibold text-yellow-400">
                    Sentiment:
                  </h2>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      result.sentiment === 'Positive'
                        ? 'bg-green-600 text-white'
                        : result.sentiment === 'Negative'
                        ? 'bg-red-600 text-white'
                        : 'bg-yellow-500 text-black'
                    }`}
                  >
                    {result.sentiment}
                  </span>
                </div>

                <Progress
                  value={Math.abs(result.score * 100)}
                  className="h-3 [&>*]:bg-yellow-400 bg-gray-700"
                />
                <p className="text-sm">
                  <span className="text-gray-400">Polarity:</span>{' '}
                  {result.score} |{' '}
                  <span className="text-gray-400">Subjectivity:</span>{' '}
                  {result.subjectivity}
                </p>

                <Tabs defaultValue="emotions" className="w-full mt-4">
                  <TabsList className="bg-gray-800 rounded-lg">
                    <TabsTrigger value="emotions">Emotions</TabsTrigger>
                    <TabsTrigger value="entities">NER</TabsTrigger>
                    <TabsTrigger value="toxicity">Toxicity</TabsTrigger>
                    <TabsTrigger value="lang">Translation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="emotions">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {Object.entries(result.emotions || {}).map(
                        ([emotion, score]: any) => (
                          <div key={emotion}>
                            <Label className="text-sm text-gray-300">
                              {emotion}
                            </Label>
                            <Progress
                              value={score * 100}
                              className={`h-2 bg-gray-700 [&>*]:${getEmotionColor(
                                emotion
                              )}`}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="entities">
                    {result.entities.length > 0 ? (
                      <ul className="mt-4 list-disc pl-4 space-y-1 text-sm">
                        {result.entities.map((ent: any, index: number) => (
                          <li key={index}>
                            <strong>{ent.text}</strong> —{' '}
                            <span className="text-yellow-300">{ent.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 mt-4 text-sm">
                        No named entities detected.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="toxicity">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {Object.entries(result.toxicity || {}).map(
                        ([key, val]: any) => (
                          <div key={key}>
                            <Label className="text-sm text-gray-300">{key}</Label>
                            <Progress
                              value={val * 100}
                              className={`h-2 bg-gray-700 [&>*]:${getToxicityColor(
                                key
                              )}`}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="lang">
                    <div className="mt-4 space-y-2 text-sm">
                      <p>
                        <strong>Detected Language:</strong>{' '}
                        <span className="text-yellow-300">{result.language}</span>
                      </p>
                      <p>
                        <strong>Translated Text:</strong>{' '}
                        <span className="text-gray-300">{result.translated_text}</span>
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
