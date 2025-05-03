import requests

def fetch_news():
    url = "https://cryptopanic.com/api/v1/posts/"
    params = {
        'auth_token': 'd99d8e5096bd49ac80b6125d33a0f3bb',
        'currencies': 'BTC,ETH',
        'public': 'true'
    }
    response = requests.get(url, params=params)
    return response.json()['results']
