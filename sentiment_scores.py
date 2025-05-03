import pandas as pd
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from tqdm import tqdm

# Load dataset
input_path = 'crypto_news_price_ohlc_dataset.csv'
output_path = 'crypto_news_price_sentiment.csv'
df = pd.read_csv(input_path)

# Load FinBERT model and tokenizer
print("Loading FinBERT model...")
tokenizer = AutoTokenizer.from_pretrained("yiyanghkust/finbert-tone")
model = AutoModelForSequenceClassification.from_pretrained("yiyanghkust/finbert-tone")
sentiment_pipeline = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)

# Analyze sentiment for each headline
sentiment_labels = []
sentiment_scores = []

print("Running sentiment analysis on headlines...")
for headline in tqdm(df['headline']):
    result = sentiment_pipeline(headline)[0]
    sentiment_labels.append(result['label'].lower())  # lowercase: positive/neutral/negative
    sentiment_scores.append(round(result['score'], 4))  # rounded confidence score

# Add results to DataFrame
df['sentiment_label'] = sentiment_labels
df['sentiment_score'] = sentiment_scores

# Save to new CSV
df.to_csv(output_path, index=False)
print(f"✅ Sentiment scores added and saved to {output_path}")