import pandas as pd
import re
import nltk
import pickle
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Download NLTK resources (run once)
nltk.download('stopwords')

# Load dataset
df = pd.read_csv('flipkart_reviews.csv')  # Ensure this file exists
print("✅ Dataset loaded successfully.")

# Drop missing and duplicate entries
df.dropna(inplace=True)
df.drop_duplicates(inplace=True)

# Preprocessing setup
stop_words = set(stopwords.words('english')) - {"not"}  # ⚠️ KEEP "not"
stemmer = PorterStemmer()

def preprocess(text):
    text = text.lower()
    text = re.sub(r'<.*?>', '', text)  # remove HTML tags
    text = re.sub(r'[^a-zA-Z]', ' ', text)  # remove numbers/symbols
    tokens = text.split()
    tokens = [stemmer.stem(word) for word in tokens if word not in stop_words]
    return ' '.join(tokens)

# Apply preprocessing
df['cleaned_review'] = df['review'].apply(preprocess)

# Encode sentiment labels
df['label'] = df['sentiment'].map({'Positive': 1, 'Negative': 0})

# Features and Labels
X = df['cleaned_review']
y = df['label']

# Improved TF-IDF with bi-gram support
tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
X_vectorized = tfidf.fit_transform(X)

# Train Logistic Regression model
model = LogisticRegression()
model.fit(X_vectorized, y)

# Save model and vectorizer
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('tfidf.pkl', 'wb') as f:
    pickle.dump(tfidf, f)

print("✅ Model and vectorizer saved as 'model.pkl' and 'tfidf.pkl'")
