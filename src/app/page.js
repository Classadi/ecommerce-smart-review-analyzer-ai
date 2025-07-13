'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [review, setReview] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeSentiment = async () => {
    if (!review.trim()) return setResult("Please enter a review.");
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/predict', {
        review: review
      });
      setResult(`Sentiment: ${response.data.sentiment}`);
    } catch (error) {
      setResult("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Flipkart Review Sentiment Analyzer</h1>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={5}
        style={{ width: '70%', padding: '10px' }}
        placeholder="Type your review..."
      />
      <br />
      <button onClick={analyzeSentiment} style={{ marginTop: '10px' }}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      <p>{result}</p>
    </main>
  );
}
