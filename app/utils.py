import pandas as pd
import numpy as np
from binance.client import Client
from newsapi import NewsApiClient
import os
from datetime import datetime, timedelta

# Initialize API clients
binance_client = Client(os.getenv('BINANCE_API_KEY'), os.getenv('BINANCE_API_SECRET'))
newsapi = NewsApiClient(api_key=os.getenv('NEWSAPI_KEY'))

def preprocess_data(df):
    """Preprocess data for LSTM model"""
    features = [
        "sentiment_num",
        "ret_5m", "ret_15m", "ret_30m",
        "vol_5m", "vol_15m", "vol_30m",
        "sin_hour", "cos_hour"
    ]
    target = "pct_return_60m"
    
    df = df.dropna(subset=features + [target])
    return df[features], df[target]

def get_macd(df):
    """Calculate MACD indicator"""
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
    """Get current price from Binance"""
    ticker = binance_client.get_symbol_ticker(symbol=f"{symbol}USDT")
    return float(ticker['price'])

def fetch_news():
    """Fetch latest crypto news"""
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

def make_predictions(df):
    """Make predictions using the LSTM model"""
    X, _ = preprocess_data(df)
    predictions = model(torch.tensor(X.values, dtype=torch.float32)).detach().numpy()
    return predictions.flatten().tolist() 