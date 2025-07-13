from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from textblob import TextBlob
from nrclex import NRCLex
from langdetect import detect
from googletrans import Translator
import spacy
from detoxify import Detoxify
import numpy as np

# 📦 Download NLTK assets
nltk.download('stopwords')

# 🔡 Load SpaCy model
nlp = spacy.load("en_core_web_sm")

# 🚀 Initialize Flask app
app = Flask(__name__)
CORS(app)

# 📁 Load ML model and vectorizer
with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('tfidf.pkl', 'rb') as f:
    tfidf = pickle.load(f)

# ☢️ Load Detoxify model once
toxicity_model = Detoxify('original')

# 🔧 Preprocessing
stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()

def preprocess(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^a-zA-Z]', ' ', text)
    tokens = text.split()
    tokens = [stemmer.stem(word) for word in tokens if word not in stop_words]
    return ' '.join(tokens)

@app.route('/')
def home():
    return jsonify({'status': '✅ API is live at /predict'})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    review = data.get('review', '').strip()

    if not review:
        return jsonify({'error': 'Review text is empty'}), 400

    # 🌐 Language Detection
    try:
        lang = detect(review)
    except Exception:
        lang = "unknown"

    # 🌍 Translate if not English
    translated = review
    if lang != 'en' and lang != 'unknown':
        try:
            translated = Translator().translate(review, dest='en').text
        except Exception as e:
            return jsonify({'error': 'Translation failed', 'detail': str(e)}), 500

    # 🧹 Preprocess
    cleaned = preprocess(translated)
    vector = tfidf.transform([cleaned])
    prediction = model.predict(vector)[0]
    sentiment = 'Positive' if prediction == 1 else 'Negative'

    # 🎯 Sentiment analysis using TextBlob
    blob = TextBlob(translated)
    polarity = float(round(blob.sentiment.polarity, 3))
    subjectivity = float(round(blob.sentiment.subjectivity, 3))

    # 🧠 Emotion detection
    emotion_scores = NRCLex(translated).raw_emotion_scores
    emotion_scores = {k: int(v) for k, v in emotion_scores.items()}  # ensure JSON serializable

    # 🏷 NER
    doc = nlp(translated)
    entities = [{'text': ent.text, 'label': ent.label_} for ent in doc.ents]

    # ☢️ Toxicity detection
    try:
        toxicity = toxicity_model.predict(translated)
        toxicity_scores = {k: float(round(v, 3)) for k, v in toxicity.items()}
    except Exception as e:
        toxicity_scores = {"error": "Toxicity model failed", "detail": str(e)}

    return jsonify({
        'sentiment': sentiment,
        'score': polarity,
        'subjectivity': subjectivity,
        'emotions': emotion_scores,
        'language': lang,
        'translated_text': translated,
        'entities': entities,
        'toxicity': toxicity_scores
    })

if __name__ == '__main__':
    print("🚀 Starting server on http://localhost:5000 ...")
    app.run(debug=True, port=5000)
