import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error
import joblib
import pathlib

# ────────────────────────────────────────────────────────────────
# 1. Load preprocessed feature CSV (with sentiment + features)
# ────────────────────────────────────────────────────────────────
df = pd.read_csv("crypto_news_features.csv", parse_dates=["timestamp"])
df = df.sort_values(["coin", "timestamp"]).reset_index(drop=True)

# Feature & target column names
features = [
    "sentiment_num",
    "ret_5m", "ret_15m", "ret_30m",
    "vol_5m", "vol_15m", "vol_30m",
    "sin_hour", "cos_hour"
]
target = "pct_return_60m"

# ────────────────────────────────────────────────────────────────
# 2. Chronological train/test split (80/20)
# ────────────────────────────────────────────────────────────────
split_idx = int(len(df) * 0.8)
df_train = df.iloc[:split_idx].copy()
df_test  = df.iloc[split_idx:].copy()

# Drop rows with any NaNs in features or target
df_train = df_train.dropna(subset=features + [target])
df_test  = df_test.dropna(subset=features + [target])

X_train, y_train = df_train[features], df_train[target]
X_test , y_test  = df_test[features],  df_test[target]

print(f"✅ train rows: {len(X_train):,}   test rows: {len(X_test):,}")

# ────────────────────────────────────────────────────────────────
# 3. Pipeline: Scale + Gradient Boosting Regressor
# ────────────────────────────────────────────────────────────────
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("gbr", GradientBoostingRegressor(
        n_estimators=300,
        max_depth=3,
        learning_rate=0.05,
        random_state=42
    ))
])

pipe.fit(X_train, y_train)

# ────────────────────────────────────────────────────────────────
# 4. Evaluation
# ────────────────────────────────────────────────────────────────
pred = pipe.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, pred))
directional = (np.sign(pred) == np.sign(y_test)).mean()

print(f"📉 RMSE: {rmse:.6f}")
print(f"📈 Directional accuracy: {directional:.2%}")

# ────────────────────────────────────────────────────────────────
# 5. Save Model for Reuse (e.g. Streamlit)
# ────────────────────────────────────────────────────────────────
model_path = pathlib.Path("app/impact_model.pkl")
model_path.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(pipe, model_path, compress=3)

print(f"✅ Model saved to: {model_path}")
