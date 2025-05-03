import pandas as pd, numpy as np

df = pd.read_csv("crypto_news_price_sentiment.csv", parse_dates=["timestamp"])

# --- ensure time is at minute resolution
df["timestamp"] = df["timestamp"].dt.floor("min")

# --- build target: 60‑minute forward %‑return per coin
k = 60                # minutes
df = df.sort_values(["coin", "timestamp"])
df["future_close"] = df.groupby("coin")["close"].shift(-k)
df["pct_return_60m"] = df["future_close"] / df["close"] - 1

# --- throw away rows that can't look ahead 60 min
df = df.dropna(subset=["pct_return_60m"])

# --- numeric sentiment feature
df["sentiment_num"] = df["sentiment_label"].map(
    {"positive": 1, "neutral": 0, "negative": -1}
) * df["sentiment_score"]

# --- simple price features
for n in (5, 15, 30):
    df[f"ret_{n}m"]  = df.groupby("coin")["close"].pct_change(n)
    df[f"vol_{n}m"]  = df.groupby("coin")["close"].rolling(n).std().reset_index(0, drop=True)

# --- time‑of‑day (cyclical)
df["hour"] = df["timestamp"].dt.hour
df["sin_hour"] = np.sin(2*np.pi*df["hour"]/24)
df["cos_hour"] = np.cos(2*np.pi*df["hour"]/24)

# --- final feature set
features = [
    "sentiment_num", "ret_5m", "ret_15m", "ret_30m",
    "vol_5m", "vol_15m", "vol_30m",
    "sin_hour", "cos_hour"
]
target = "pct_return_60m"

df.to_csv("crypto_news_features.csv", index=False)
print("✅ Feature-enhanced dataset saved to crypto_news_features.csv")

