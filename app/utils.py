import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from datetime import datetime, timedelta
from binance.client import Client
from newsapi import NewsApiClient

from LSTM_model import LSTMRegressor  # Import only the class, not the training logic

# ────────────────────────────────
# Load trained LSTM model
# ────────────────────────────────
model = LSTMRegressor(input_dim=9, hidden_dim=64)
model.load_state_dict(torch.load('best_lstm_model.pt', map_location=torch.device('cpu')))
model.eval()

# ────────────────────────────────
# API Clients
# ────────────────────────────────
binance_client = Client(os.getenv('BINANCE_API_KEY'), os.getenv('bC2PE67Aowu2F6vqFnzi0sPvuh1sPEd9c0ZUUMbEe5ZDFbMhfTXrtUGD1Y7gSWrs'))
newsapi = NewsApiClient(api_key=os.getenv('NEWSAPI_KEY'))

# ────────────────────────────────
# Helper Functions
# ────────────────────────────────

def preprocess_data(df):
    features = [
        "sentiment_num",
        "ret_5m", "ret_15m", "ret_30m",
        "vol_5m", "vol_15m", "vol_30m",
        "sin_hour", "cos_hour"
    ]
    target = "pct_return_60m"
    
    df = df.dropna(subset=features + [target])
    return df[features], df[target]

def create_sequences(X, window=20):
    sequences = []
    for i in range(len(X) - window + 1):
        seq = X.iloc[i:i+window].values
        sequences.append(seq)
    return torch.tensor(np.array(sequences), dtype=torch.float32)

def get_macd(df):
    exp1 = df['close'].ewm(span=12, adjust=False).mean()
    exp2 = df['close'].ewm(span=26, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9, adjust=False).mean()
    return {
        'macd': macd.tolist(),
        'signal': signal.tolist(),
        'histogram': (macd - signal).tolist()
    }

def get_current_price(symbol):
    ticker = binance_client.get_symbol_ticker(symbol=f"{symbol}USDT")
    return float(ticker['price'])

def fetch_news():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=1)
    articles = newsapi.get_everything(
        q='cryptocurrency OR bitcoin OR ethereum OR bnb OR xrp OR solana',
        from_param=start_date.strftime('%Y-%m-%d'),
        to=end_date.strftime('%Y-%m-%d'),
        language='en',
        sort_by='publishedAt'
    )
    return [{
        'title': article['title'],
        'description': article['description'],
        'url': article['url'],
        'publishedAt': article['publishedAt'],
        'source': article['source']['name']
    } for article in articles.get('articles', [])]

def generate_features(df):
    """
    Given a DataFrame with at least:
      ['coin','timestamp','close','volume','sentiment']
    this will compute:
      - pct_return_60m
      - sentiment_num
      - ret_{5,15,30}m
      - vol_{5,15,30}m
      - sin_hour, cos_hour
    and return the augmented DataFrame.
    """
    # ensure datetime
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    # sort by coin/time
    df = df.sort_values(['coin','timestamp'])

    # 1) 60-min forward return
    df['future_close'] = df.groupby('coin')['close'].shift(-60)
    df['pct_return_60m'] = df['future_close'] / df['close'] - 1

    # 2) numeric sentiment (adjust to your schema!)
    # if your CSV has a column called 'sentiment' with values 'positive' etc:
    df['sentiment_num'] = df['sentiment'].map({
        'positive': 1,
        'neutral': 0,
        'negative': -1
   })

    # 3) x-minute returns & rolling vol
    for n in (5, 15, 30):
        df[f'ret_{n}m'] = df.groupby('coin')['close'].pct_change(n)
        df[f'vol_{n}m'] = (
            df.groupby('coin')['volume']
              .rolling(window=n, min_periods=1)
              .std()
              .reset_index(level=0, drop=True)
        )

    # 4) cyclical time
    df['hour'] = df['timestamp'].dt.hour
    df['sin_hour'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['cos_hour'] = np.cos(2 * np.pi * df['hour'] / 24)

    return df

def make_predictions(df):
    required_columns = [
        "sentiment_num",
        "ret_5m", "ret_15m", "ret_30m",
        "vol_5m", "vol_15m", "vol_30m",
        "sin_hour", "cos_hour", "pct_return_60m"
    ]

    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns for prediction: {missing}")

    X_df, _ = preprocess_data(df)
    if len(X_df) < 20:
        raise ValueError("Not enough data to form a sequence (requires at least 20 rows)")

    X_seq = create_sequences(X_df)

    with torch.no_grad():
        predictions = model(X_seq).detach().numpy()

    return predictions.flatten().tolist()
