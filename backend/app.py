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

# 📦 Download NLTK assets (only if not already downloaded)
try:
    
    nltk.data.find('corpora/stopwords')
except nltk.downloader.DownloadError:
    nltk.download('stopwords')
# You might need 'punkt' for some tokenization, if not already downloaded:
# try:
#     nltk.data.find('tokenizers/punkt')
# except nltk.downloader.DownloadError:
#     nltk.download('punkt')

# 🔡 Load SpaCy model (download if not found)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading en_core_web_sm model for SpaCy. This may take a moment...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# 🚀 Initialize Flask app
app = Flask(__name__)
CORS(app) # Enable CORS for all routes from any origin during development

# 📁 Load ML model and vectorizer
# Ensure these files ('model.pkl', 'tfidf.pkl') are in the same directory as app.py
model = None
tfidf = None
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('tfidf.pkl', 'rb') as f:
        tfidf = pickle.load(f)
    print("✅ ML model and TF-IDF vectorizer loaded successfully.")
except FileNotFoundError:
    print("❌ ERROR: model.pkl or tfidf.pkl not found. Sentiment prediction from custom model will be disabled.")
except Exception as e:
    print(f"❌ ERROR loading ML model/TF-IDF: {e}. Sentiment prediction from custom model will be disabled.")


# ☢️ Load Detoxify model once
toxicity_model = None
try:
    toxicity_model = Detoxify('original')
    print("✅ Detoxify model loaded successfully.")
except Exception as e:
    print(f"❌ ERROR: Could not load Detoxify model: {e}. Toxicity analysis will be disabled.")

# 🔧 Preprocessing setup
stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()

def preprocess(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text) # Remove HTML tags
    text = re.sub(r'[^a-zA-Z\s]', '', text) # Keep only letters and spaces
    tokens = text.split()
    tokens = [stemmer.stem(word) for word in tokens if word not in stop_words]
    return ' '.join(tokens)

@app.route('/')
def home():
    return jsonify({'status': '✅ Flipkart Review Analyzer API is live. Send POST request to /predict'})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    review = data.get('review', '').strip()

    if not review:
        print("Received empty review, returning 400.") # For server logs
        return jsonify({'error': 'Review text is empty'}), 400

    print(f"Received review: '{review}' (Length: {len(review)})")

    # Initialize all results to default/empty values
    lang = "en"
    translated_text = review
    sentiment_string = 'Neutral'
    polarity = 0.0
    subjectivity = 0.0
    emotions = {}
    entities = []
    toxicity_scores = {}

    # 🌐 Language Detection
    try:
        lang = detect(review)
        print(f"Detected language: {lang}")
    except Exception as e:
        print(f"Language detection failed for review: '{review}' - {e}. Defaulting to English.")

    # 🌍 Translate if not English
    if lang != 'en' and lang != 'unknown':
        try:
            translator = Translator()
            translated_text = translator.translate(review, dest='en').text
            print(f"Translated review to English: '{translated_text}'")
        except Exception as e:
            print(f"Translation failed: {e}. Proceeding with original text for analysis.")
            # Do not return 500 here; try to analyze what we have.
            translated_text = review # Revert to original if translation fails


    # 🎯 Sentiment analysis using TextBlob (primary source for score and sentiment string)
    try:
        blob = TextBlob(translated_text)
        polarity = float(round(blob.sentiment.polarity, 3))
        subjectivity = float(round(blob.sentiment.subjectivity, 3))

        if polarity > 0:
            sentiment_string = 'Positive'
        elif polarity < 0:
            sentiment_string = 'Negative'
        else:
            sentiment_string = 'Neutral'
        print(f"TextBlob Sentiment: {sentiment_string}, Polarity: {polarity}, Subjectivity: {subjectivity}")
    except Exception as e:
        print(f"TextBlob sentiment analysis failed: {e}")


    # 🧠 Emotion detection using NRCLex (affect_frequencies provides normalized scores)
    try:
        emotion_analyzer = NRCLex(translated_text)
        # affect_frequencies returns normalized scores (0 to 1)
        # Filter out very low scores to prevent tiny pie chart slices
        emotions_raw = emotion_analyzer.affect_frequencies
        emotions = {k: round(v, 3) for k, v in emotions_raw.items() if v > 0.001} # Keep if > 0.1%
        print(f"NRCLex Emotions: {emotions}")
    except Exception as e:
        print(f"NRCLex emotion detection failed: {e}")


    # 🏷 NER (Named Entity Recognition)
    try:
        doc = nlp(translated_text)
        entities = [{'text': ent.text, 'label': ent.label_} for ent in doc.ents]
        print(f"NER Entities: {entities}")
    except Exception as e:
        print(f"SpaCy NER processing failed: {e}")


    # ☢️ Toxicity detection using Detoxify
    if toxicity_model:
        try:
            toxicity_raw = toxicity_model.predict(translated_text)
            # Filter out very low scores for toxicity categories for cleaner display
            toxicity_scores = {k: float(round(v, 3)) for k, v in toxicity_raw.items() if v > 0.001}
            print(f"Detoxify Toxicity Scores: {toxicity_scores}")

            # Special handling for "toxicity" if other categories are zero:
            # If all other specific toxicity types are zero, but 'toxicity' itself has a score,
            # ensure 'toxicity' is represented in the pie chart.
            if 'toxicity' in toxicity_raw and toxicity_raw['toxicity'] > 0.001 and not any(v > 0.001 for k,v in toxicity_raw.items() if k != 'toxicity'):
                 toxicity_scores = {'toxicity': round(toxicity_raw['toxicity'], 3)} # Only send overall toxicity if sub-types are negligible
                 print(f"Refined Toxicity for Pie: {toxicity_scores}")


        except Exception as e:
            print(f"Detoxify model prediction failed: {e}")
            toxicity_scores = {"error": "Toxicity model failed", "detail": str(e)}
    else:
        print("Detoxify model not loaded, skipping toxicity analysis.")
        toxicity_scores = {"info": "Toxicity model not available"}


    # If you still need your custom ML model's prediction for some reason,
    # you can put it here, but ensure it feeds into a separate field or logic.
    # cleaned_review_ml = preprocess(translated_text)
    # ml_sentiment_prediction = "N/A"
    # if model and tfidf and cleaned_review_ml:
    #     try:
    #         vector_ml = tfidf.transform([cleaned_review_ml])
    #         ml_prediction_raw = model.predict(vector_ml)[0] # Get raw 0 or 1
    #         ml_sentiment_prediction = 'Positive' if ml_prediction_raw == 1 else 'Negative'
    #         print(f"Custom ML Model Sentiment: {ml_sentiment_prediction}")
    #     except Exception as e:
    #         print(f"Custom ML Model prediction failed: {e}")


    response_data = {
        'sentiment': sentiment_string,
        'score': polarity,
        'subjectivity': subjectivity,
        'emotions': emotions,
        'language': lang,
        'translated_text': translated_text,
        'entities': entities,
        'toxicity': toxicity_scores # This will now reflect the filtered/processed scores
        # 'custom_ml_sentiment': ml_sentiment_prediction # Example if you want to include custom model
    }

    print(f"Final JSON Response: {response_data}")
    return jsonify(response_data)

if __name__ == '__main__':
    print("🚀 Starting Flask server on http://localhost:5000 ...")
    app.run(debug=True, port=5000)