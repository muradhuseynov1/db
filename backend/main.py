import requests
import pandas as pd
from datetime import datetime, timedelta
import time

# --- CONFIG ---
NEWSAPI_KEY = '78a444efa04c4a5cb28e653b6c57f67b'
COINLAYER_API_KEY = '0b55e8699e1af819a9db81647a605ab8'
BINANCE_API_KEY = 'bC2PE67Aowu2F6vqFnzi0sPvuh1sPEd9c0ZUUMbEe5ZDFbMhfTXrtUGD1Y7gSWrs'
CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL']
TARGET_CURRENCY = 'USD'

CRYPTO_PAIRS = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'BNB': 'BNBUSDT',
    'XRP': 'XRPUSDT',
    'SOL': 'SOLUSDT'
}

COIN_KEYWORDS = {
    'BTC': ['bitcoin', 'btc'],
    'ETH': ['ethereum', 'eth'],
    'BNB': ['binance coin', 'bnb'],
    'XRP': ['ripple', 'xrp'],
    'SOL': ['solana', 'sol']
}

def fetch_news_by_date(date_str):
    url = "https://newsapi.org/v2/everything"
    params = {
        'q': 'cryptocurrency OR bitcoin OR ethereum OR bnb OR xrp OR solana',
        'from': date_str,
        'to': date_str,
        'sortBy': 'publishedAt',
        'language': 'en',
        'pageSize': 100,
        'apiKey': NEWSAPI_KEY
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get('articles', [])
    print(f"News fetch error ({date_str}):", response.json())
    return []

def fetch_historical_price(date, symbols, target_currency, access_key):
    url = f"https://api.coinlayer.com/{date}"
    params = {
        'access_key': access_key,
        'symbols': ','.join(symbols),
        'target': target_currency
    }
    response = requests.get(url, params=params)
    data = response.json()
    if data.get('success'):
        return data['rates']
    else:
        print(f"Price fetch error ({date}):", data.get('error'))
        return None

def detect_coins_from_title(title):
    title = title.lower()
    matched_coins = []
    for symbol, keywords in COIN_KEYWORDS.items():
        if any(keyword in title for keyword in keywords):
            matched_coins.append(symbol)
    return matched_coins

def fetch_binance_ohlc(symbol, timestamp):
    start_time = int(timestamp.timestamp() // 3600 * 3600 * 1000)  # beginning of the hour
    end_time = start_time + 3600 * 1000
    url = "https://api.binance.com/api/v3/klines"
    params = {
        'symbol': symbol,
        'interval': '1h',
        'startTime': start_time,
        'endTime': end_time,
        'limit': 1
    }
    response = requests.get(url, params=params)
    if response.status_code == 200 and response.json():
        kline = response.json()[0]
        return {
            'open': float(kline[1]),
            'high': float(kline[2]),
            'low': float(kline[3]),
            'close': float(kline[4])
        }
    return None

def build_dataset(start_date, end_date):
    current_date = start_date
    final_data = []

    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        print(f"Processing {date_str}...")

        news_items = fetch_news_by_date(date_str)
        prices = fetch_historical_price(date_str, CRYPTO_SYMBOLS, TARGET_CURRENCY, COINLAYER_API_KEY)

        if prices is None:
            current_date += timedelta(days=1)
            time.sleep(1)
            continue

        for item in news_items:
            published = item.get('publishedAt')
            if not published:
                continue

            dt = datetime.strptime(published, "%Y-%m-%dT%H:%M:%SZ")
            coins = detect_coins_from_title(item['title'])

            for coin in coins:
                if coin not in prices or coin not in CRYPTO_PAIRS:
                    continue

                ohlc = fetch_binance_ohlc(CRYPTO_PAIRS[coin], dt)
                if ohlc is None:
                    continue

                final_data.append({
                    'timestamp': published,
                    'coin': coin,
                    'headline': item.get('title'),
                    'description': item.get('description', ''),
                    'source': item.get('source', {}).get('name', 'Unknown'),
                    'price_usd': prices[coin],
                    'open': ohlc['open'],
                    'high': ohlc['high'],
                    'low': ohlc['low'],
                    'close': ohlc['close']
                })
                time.sleep(0.25)  # Avoid Binance rate limit

        current_date += timedelta(days=1)
        time.sleep(1)

    return pd.DataFrame(final_data)

if __name__ == '__main__':
    start = datetime.strptime('2025-03-20', '%Y-%m-%d')
    end = datetime.strptime('2025-04-01', '%Y-%m-%d')

    df = build_dataset(start, end)

    if not df.empty:
        df = df.sort_values(by='timestamp')
        df.to_csv('crypto_news_price_ohlc_dataset.csv', index=False)
        print("✅ Saved to crypto_news_price_ohlc_dataset.csv")
    else:
        print("⚠️ No data collected.")
