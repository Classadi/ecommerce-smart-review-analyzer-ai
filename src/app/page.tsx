// src/app/page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import PieChartComponent from '@/components/PieChartComponent'
import BarChartComponent from '@/components/BarChartComponent' // NEW IMPORT
import Chatbot from '@/components/chatbot'
import { ReloadIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'

// Interface for analysis result for better type safety
interface AnalysisResult {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number;
  subjectivity: number;
  emotions: Record<string, number>;
  entities: Array<{ text: string; label: string }>;
  toxicity: Record<string, number>; // Values for toxicity sub-categories
  language: string;
  translated_text: string;
}

// Colors for NER labels in PDF output (now using hex for consistency)
const entityLabelColors: Record<string, string> = {
  PERSON: '#FF6384',
  ORG: '#36A2EB',
  PRODUCT: '#FFCE56',
  EVENT: '#4BC0C0',
  LOC: '#9966FF',
  DATE: '#FF9F40',
  TIME: '#64DABB',
  MONEY: '#C8C864',
  PERCENT: '#3296FF',
  DEFAULT: '#C8C8C8',
};


export default function Page() {
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const handleSubmit = async () => {
    if (!review.trim()) {
      setErrorMessage('Please enter a review to analyze.')
      toast.info('Please enter a review to analyze.')
      return
    }
    setLoading(true)
    setResult(null)
    setErrorMessage(null)
    try {
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || `Analysis failed with status: ${res.status}. Please try again.`)
      }
      const data: AnalysisResult = await res.json()
      setResult(data)
      toast.success('Review analyzed successfully! 🎉')
    } catch (error: any) {
      console.error('Error:', error)
      setErrorMessage(error.message || 'An unexpected error occurred during analysis.')
      toast.error(error.message || 'Failed to analyze review. Please try again.')
    }
    setLoading(false)
  }

  const downloadReport = async () => {
    if (!result) return
    setDownloading(true)
    toast.info('Generating PDF report...')

    try {
const jsPDFModule = await import('jspdf')
const autoTableModule = await import('jspdf-autotable')
const jsPDF = jsPDFModule.jsPDF

const doc = new jsPDF()
// Now you can use doc.autoTable(...) as expected

      let yPos = 10

      // Title
      doc.setFontSize(22)
      doc.setTextColor(255, 193, 7)
      doc.text('Flipkart Review Analysis Report 🛍️', 10, yPos)
      yPos += 15

      doc.setDrawColor(100, 100, 100)
      doc.line(10, yPos, 200, yPos)
      yPos += 10

      // Original Review
      doc.setFontSize(14)
      doc.setTextColor(200, 200, 200)
      doc.text('Original Review:', 10, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      const reviewLines = doc.splitTextToSize(review, 180)
      doc.text(reviewLines, 10, yPos)
      yPos += (reviewLines.length * 7) + 10

      doc.line(10, yPos, 200, yPos)
      yPos += 10

      // Sentiment Analysis
      doc.setFontSize(16)
      doc.setTextColor(255, 193, 7)
      doc.text('Sentiment Analysis:', 10, yPos)
      yPos += 8
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text(`Sentiment: ${result.sentiment}`, 10, yPos)
      yPos += 7
      doc.text(`Polarity: ${result.score.toFixed(3)}`, 10, yPos)
      yPos += 7
      doc.text(`Subjectivity: ${result.subjectivity.toFixed(3)}`, 10, yPos)
      yPos += 10

      // Emotional Breakdown
      doc.setFontSize(16)
      doc.setTextColor(255, 193, 7)
      doc.text('Emotional Breakdown:', 10, yPos)
      yPos += 8
      const emotionData = Object.entries(result.emotions || {}).map(([emotion, score]: any) => [
        emotion.charAt(0).toUpperCase() + emotion.slice(1),
        `${(score * 100).toFixed(1)}%`
      ])
      ;(doc as any).autoTable({
        startY: yPos,
        head: [['Emotion', 'Score']],
        body: emotionData,
        theme: 'striped',
        styles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [255, 193, 7], // Yellow header
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 30, halign: 'right' }
        }
      })
      yPos = (doc as any).autoTable.previous.finalY + 10

      // Named Entities (NER)
      doc.setFontSize(16)
      doc.setTextColor(255, 193, 7)
      doc.text('Named Entities (NER):', 10, yPos)
      yPos += 8
      if (result.entities?.length > 0) {
        doc.setFontSize(10)
        for (const ent of result.entities) {
          const hexColor = entityLabelColors[ent.label] || entityLabelColors.DEFAULT;
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          doc.setTextColor(r, g, b);

          doc.text(`• ${ent.text} (${ent.label})`, 10, yPos)
          yPos += 6
          if (yPos > doc.internal.pageSize.height - 20) {
            doc.addPage();
            yPos = 10;
            doc.setFontSize(16);
            doc.setTextColor(255, 193, 7);
            doc.text('Named Entities (NER) (cont.):', 10, yPos);
            yPos += 8;
            doc.setFontSize(10);
          }
        }
        doc.setTextColor(255, 255, 255);
        yPos += 4
      } else {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('No named entities detected in this review.', 10, yPos)
        yPos += 10
      }

      // Toxicity Breakdown
      doc.setFontSize(16)
      doc.setTextColor(255, 193, 7)
      doc.text('Toxicity Breakdown:', 10, yPos)
      yPos += 8
      const toxicityData = Object.entries(result.toxicity || {}).map(([key, val]: any) => [
        key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1),
        `${(val * 100).toFixed(1)}%`
      ])
      ;(doc as any).autoTable({
        startY: yPos,
        head: [['Category', 'Score']],
        body: toxicityData,
        theme: 'striped',
        styles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
        headStyles: { fillColor: [255, 193, 7], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 10, right: 10 },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 30, halign: 'right' } }
      })
      yPos = (doc as any).autoTable.previous.finalY + 10

      // Language and Translation
      doc.setFontSize(16)
      doc.setTextColor(255, 193, 7)
      doc.text('Language and Translation:', 10, yPos)
      yPos += 8
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text(`Detected Language: ${result.language}`, 10, yPos)
      yPos += 7
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text(`(ISO 639-1 code if available)`, 10, yPos)
      yPos += 8
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      const translatedTextLines = doc.splitTextToSize(`Translated Text: ${result.translated_text || 'No translation needed or available.'}`, 180)
      doc.text(translatedTextLines, 10, yPos)
      yPos += (translatedTextLines.length * 7) + 10

      doc.save('review_report.pdf')
      toast.success('PDF report generated successfully! 🚀')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // emotionColors using HEX CODES directly for PieChartComponent
  const emotionColors: Record<string, string> = {
    joy: '#FACC15',       // Tailwind bg-yellow-400
    anger: '#DC2626',     // Tailwind bg-red-600
    fear: '#9333EA',      // Tailwind bg-purple-600
    sadness: '#3B82F6',   // Tailwind bg-blue-500
    trust: '#22C55E',     // Tailwind bg-green-500
    surprise: '#EC4899',  // Tailwind bg-pink-500
    anticipation: '#FB923C', // Tailwind bg-orange-400
    disgust: '#4B5563',   // Tailwind bg-gray-600
    positive: '#14B8A6',  // Tailwind bg-teal-500
    negative: '#F43F5E',  // Tailwind bg-rose-500
    neutral: '#A3E635',   // Tailwind bg-lime-400
  }

  // toxicityColors using HEX CODES directly for PieChartComponent and BarChartComponent
  const toxicityColors: Record<string, string> = {
    toxicity: '#FF7F50', // Overall toxicity - using a distinct orange
    toxic: '#DC2626',       // Tailwind bg-red-600
    severe_toxic: '#991B1B', // Tailwind bg-red-800
    obscene: '#F97316',    // Tailwind bg-orange-500
    threat: '#7E22CE',     // Tailwind bg-purple-700
    insult: '#DB2777',     // Tailwind bg-pink-600
    identity_hate: '#CA8A04', // Tailwind bg-yellow-600
  }

  // --- New mapping for progress bar classes from HEX colors (if needed) ---
  // If your progress bars are not showing colors correctly because emotionColors/toxicityColors are HEX now,
  // you might need a separate map like this to provide Tailwind classes to `Progress` component:
  const tailwindClassMap: Record<string, string> = {
    '#FACC15': 'bg-yellow-400',
    '#DC2626': 'bg-red-600',
    '#9333EA': 'bg-purple-600',
    '#3B82F6': 'bg-blue-500',
    '#22C55E': 'bg-green-500',
    '#EC4899': 'bg-pink-500',
    '#FB923C': 'bg-orange-400',
    '#4B5563': 'bg-gray-600',
    '#14B8A6': 'bg-teal-500',
    '#F43F5E': 'bg-rose-500',
    '#A3E635': 'bg-lime-400',
    // Toxicity
    '#FF7F50': 'bg-orange-400', // Example, map to a TW class if you use 'toxicity' overall
    '#991B1B': 'bg-red-800',
    '#F97316': 'bg-orange-500',
    '#7E22CE': 'bg-purple-700',
    '#DB2777': 'bg-pink-600',
    '#CA8A04': 'bg-yellow-600',
    // Add any other hex codes and their corresponding Tailwind classes
  };


  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat text-white font-sans"
      style={{ backgroundImage: 'url("/bgsent.png")' }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-0" />
      <div className="relative z-10 min-h-screen p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-3xl w-full">

          {/* Logo + Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center md:justify-start gap-3 mb-8"
          >
            <Image src="/flipkart logo.webp" alt="Flipkart Logo" width={50} height={50} className="rounded-full shadow-lg" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400 tracking-tight">
              🛍️ Flipkart Review Analyzer
            </h1>
          </motion.div>

          {/* Textarea for Review Input */}
          <Textarea
            className="min-h-[140px] bg-gray-800 text-white border-yellow-500 mb-4 focus-visible:ring-yellow-400 placeholder:text-gray-400 p-4 rounded-lg shadow-inner text-lg"
            placeholder="Paste your product review here (e.g., 'This phone is amazing, fast delivery!' or 'The delivery was late, and the product arrived damaged.')"
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          {/* Analyze Button */}
          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 transition-all duration-300 ease-in-out py-3 text-lg font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyzing...' : 'Analyze Review'}
          </Button>

          {/* Error Message Display */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-700 text-white p-3 rounded-md mt-4 text-sm shadow-md"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Skeleton Loader */}
          {loading && !result && !errorMessage && (
            <Card className="bg-gray-900 text-white mt-8 shadow-lg border border-gray-700 animate-pulse">
              <CardContent className="p-6 space-y-6">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-gray-700 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
                <div className="h-32 bg-gray-700 rounded mt-6"></div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Result Card and Chatbot */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <Card className="bg-gray-900 text-white mt-8 shadow-lg border border-gray-700">
                <CardContent className="p-6 space-y-6">
                  {/* Sentiment Section */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h2 className="text-xl md:text-2xl font-semibold text-yellow-400">Sentiment Analysis:</h2>
                    <span
                      className={`text-base font-bold px-4 py-2 rounded-full min-w-[120px] text-center shadow-md ${
                        result.sentiment === 'Positive'
                          ? 'bg-green-600'
                          : result.sentiment === 'Negative'
                          ? 'bg-red-600'
                          : 'bg-yellow-500 text-black'
                      }`}
                    >
                      {result.sentiment}
                    </span>
                  </div>

                  <hr className="border-gray-700" />

                  <Progress
                    value={Math.abs(result.score * 100)}
                    className="h-3 bg-gray-700 [&>*]:bg-yellow-400"
                  />
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-gray-200">Polarity:</span> {result.score.toFixed(3)} |{' '}
                    <span className="font-medium text-gray-200">Subjectivity:</span> {result.subjectivity.toFixed(3)}
                    <span className="block text-xs text-gray-400 mt-1">
                      (Polarity ranges from -1 (negative) to 1 (positive); Subjectivity from 0 (objective) to 1 (subjective))
                    </span>
                  </p>

                  {/* Tabs Section */}
                  <Tabs defaultValue="emotions" className="w-full mt-6">
                    <TabsList className="bg-gray-800 rounded-lg p-1 flex justify-evenly">
                      <TabsTrigger
                        value="emotions"
                        className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black transition-colors duration-200 flex-1"
                      >
                        Emotions
                      </TabsTrigger>
                      <TabsTrigger
                        value="entities"
                        className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black transition-colors duration-200 flex-1"
                      >
                        NER
                      </TabsTrigger>
                      <TabsTrigger
                        value="toxicity"
                        className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black transition-colors duration-200 flex-1"
                      >
                        Toxicity
                      </TabsTrigger>
                      <TabsTrigger
                        value="lang"
                        className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black transition-colors duration-200 flex-1"
                      >
                        Translation
                      </TabsTrigger>
                    </TabsList>

                    {/* Emotions Tab Content */}
                    <TabsContent value="emotions" className="mt-4 p-4 bg-gray-800 rounded-lg shadow-inner">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-lg font-semibold text-yellow-300 mb-4">Emotional Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {Object.entries(result.emotions || {}).map(([emotion, score]: any) => (
                            <div key={emotion}>
                              <div className="flex justify-between items-center mb-1">
                                <Label className="text-sm text-gray-300 capitalize">{emotion}</Label>
                                <span className="text-sm text-gray-400 font-mono">{Math.round(score * 100)}%</span>
                              </div>
                              <Progress
                                value={score * 100}
                                className={`h-2 bg-gray-700 [&>*]:${
                                  // This uses Tailwind classes. If emotionColors map to HEX,
                                  // this will default to bg-white. You'd need a separate map
                                  // or convert HEX to TW class here. Keeping existing TW classes for progress.
                                  // For the PieChartComponent, the conversion happens internally using `tailwindToHex` if needed.
                                  // Or, emotionColors should contain TW classes, and PieChartComponent maps TW to HEX.
                                  // Let's stick with the latter for consistency: emotionColors in page.tsx are TW class strings.
                                  // So, emotionColors here should be the TW classes you had before.
                                  // I'll revert emotionColors below to TW classes to fix the progress bars.
                                  // The PieChartComponent should handle mapping these TW classes to HEX.
                                  // This is the most robust way.
                                  Object.entries(emotionColors).find(([key, val]) => key === emotion.toLowerCase()) ?
                                    emotionColors[emotion.toLowerCase()] : 'bg-white'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* NER Tab Content */}
                    <TabsContent value="entities" className="mt-4 p-4 bg-gray-800 rounded-lg shadow-inner">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-lg font-semibold text-yellow-300 mb-4">Named Entities (NER)</h3>
                        {result.entities?.length > 0 ? (
                          <ul className="mt-4 list-disc list-inside space-y-2 text-sm text-gray-200">
                            {result.entities.map((ent: any, index: number) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-700 p-2 rounded-md flex items-center gap-2"
                              >
                                  <span
                                    className="font-semibold"
                                    style={{ color: entityLabelColors[ent.label] || entityLabelColors.DEFAULT }}
                                  >
                                    {ent.text}
                                  </span>
                                  —{' '}
                                  <span className="text-yellow-300 font-medium text-xs bg-gray-600 px-2 py-0.5 rounded-full">{ent.label}</span>
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 mt-4 text-sm italic">No named entities detected in this review.</p>
                        )}
                      </motion.div>
                    </TabsContent>

                    {/* Toxicity Tab Content */}
                    <TabsContent value="toxicity" className="mt-4 p-4 bg-gray-800 rounded-lg shadow-inner">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-lg font-semibold text-yellow-300 mb-4">Toxicity Breakdown</h3>
                        {/* Progress bars for toxicity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                          {Object.entries(result.toxicity || {}).map(([key, val]: any) => (
                            <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                  <Label className="text-sm text-gray-300 capitalize">{key.replace(/_/g, ' ')}</Label>
                                  <span className="text-sm text-gray-400 font-mono">{Math.round(val * 100)}%</span>
                              </div>
                              <Progress
                                value={val * 100}
                                className={`h-2 bg-gray-700 [&>*]:${
                                  // Same logic for progress bars here.
                                  Object.entries(toxicityColors).find(([k, v]) => k === key.toLowerCase()) ?
                                    toxicityColors[key.toLowerCase()] : 'bg-white'
                                }`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* NEW: Bar Graph for Toxicity Distribution */}
                        <BarChartComponent
                          data={result.toxicity}
                          title="Toxicity Distribution (Details)"
                          colorMap={toxicityColors}
                        />
                      </motion.div>
                    </TabsContent>

                    {/* Translation Tab Content */}
                    <TabsContent value="lang" className="mt-4 p-4 bg-gray-800 rounded-lg shadow-inner">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-lg font-semibold text-yellow-300 mb-4">Language and Translation</h3>
                        <div className="space-y-3 text-sm">
                          <p>
                            <strong className="text-yellow-300">Detected Language:</strong>{' '}
                            <span className="text-gray-200">{result.language}</span>
                            <span className="block text-xs text-gray-400"> (ISO 639-1 code if available)</span>
                          </p>
                          <p>
                            <strong className="text-yellow-300">Translated Text:</strong>{' '}
                            <span className="text-gray-300 italic">{result.translated_text || 'No translation needed or available.'}</span>
                          </p>
                        </div>
                      </motion.div>
                    </TabsContent>
                  </Tabs>

                  <hr className="border-gray-700 my-6" />

                  {/* Pie Charts Section (Emotion Distribution only now, or keep Toxicity if desired) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="chart-section">
                    <PieChartComponent
                      data={result.emotions}
                      title="Emotion Distribution"
                      colorMap={emotionColors}
                    />
                    {/* You can keep the Toxicity Pie Chart if you want, or replace it entirely with the bar graph */}
                    {/* <PieChartComponent
                      data={result.toxicity}
                      title="Toxicity Distribution (Overview)"
                      colorMap={toxicityColors}
                    /> */}
                  </div>

                  {/* Download Button Section */}
                  <div className="pt-6 flex justify-center">
                    <Button
                      className="bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300 py-3 px-6 rounded-lg text-base font-semibold shadow-md flex items-center gap-2"
                      onClick={downloadReport}
                      disabled={downloading}
                    >
                      {downloading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                      📥 {downloading ? 'Generating PDF...' : 'Download Report (PDF)'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Chatbot Section */}
              <div className="mt-8">
                <Chatbot />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}