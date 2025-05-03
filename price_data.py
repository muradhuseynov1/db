import requests

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
        print(f"Error fetching data: {data.get('error')}")
        return None

# Example usage
date = '2025-05-01'
symbols = ['BTC', 'ETH']
target_currency = 'USD'
access_key = 'd0e0fa4d74ee1c3140a6e6533e98d438'
prices = fetch_historical_price(date, symbols, target_currency, access_key)
print(prices)
