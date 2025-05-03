import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset, random_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
import os

# ────────────────────────────────────────────────────────────────
# 1. Load & preprocess
# ────────────────────────────────────────────────────────────────
df = pd.read_csv("crypto_news_features.csv", parse_dates=["timestamp"])
df = df.sort_values(["coin", "timestamp"]).reset_index(drop=True)

features = [
    "sentiment_num",
    "ret_5m", "ret_15m", "ret_30m",
    "vol_5m", "vol_15m", "vol_30m",
    "sin_hour", "cos_hour"
]
target = "pct_return_60m"

df = df.dropna(subset=features + [target])

# ────────────────────────────────────────────────────────────────
# 2. Create sequences
# ────────────────────────────────────────────────────────────────
sequence_length = 20

def create_sequences(data, target_col, window):
    Xs, ys = [], []
    for _, coin_df in data.groupby("coin"):
        coin_df = coin_df.reset_index(drop=True)
        for i in range(len(coin_df) - window):
            Xs.append(coin_df.loc[i:i+window-1, features].values)
            ys.append(coin_df.loc[i+window, target_col])
    return np.array(Xs), np.array(ys)

X, y = create_sequences(df, target, sequence_length)

# ────────────────────────────────────────────────────────────────
# 3. Train/Test split
# ────────────────────────────────────────────────────────────────
split = int(len(X) * 0.8)
X_train, y_train = X[:split], y[:split]
X_test, y_test = X[split:], y[split:]

# ────────────────────────────────────────────────────────────────
# 4. Normalize features
# ────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_train_scaled = X_train.copy()
X_test_scaled = X_test.copy()

for i in range(X.shape[2]):
    scaler.fit(X_train[:, :, i].reshape(-1, 1))
    X_train_scaled[:, :, i] = scaler.transform(X_train[:, :, i].reshape(-1, 1)).reshape(X_train.shape[0], X_train.shape[1])
    X_test_scaled[:, :, i] = scaler.transform(X_test[:, :, i].reshape(-1, 1)).reshape(X_test.shape[0], X_test.shape[1])

# PyTorch tensors
X_train_t = torch.tensor(X_train_scaled, dtype=torch.float32)
y_train_t = torch.tensor(y_train, dtype=torch.float32).view(-1, 1)
X_test_t = torch.tensor(X_test_scaled, dtype=torch.float32)
y_test_t = torch.tensor(y_test, dtype=torch.float32).view(-1, 1)

# Split training set into train/val (90/10)
val_size = int(0.1 * len(X_train_t))
train_size = len(X_train_t) - val_size
train_ds, val_ds = random_split(TensorDataset(X_train_t, y_train_t), [train_size, val_size])
test_ds = TensorDataset(X_test_t, y_test_t)

train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
val_loader = DataLoader(val_ds, batch_size=32)

# ────────────────────────────────────────────────────────────────
# 5. LSTM model
# ────────────────────────────────────────────────────────────────
class LSTMRegressor(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_layers=1):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        out = self.dropout(lstm_out[:, -1, :])
        return self.fc(out)

model = LSTMRegressor(input_dim=X.shape[2], hidden_dim=64)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# ────────────────────────────────────────────────────────────────
# 6. Training with early stopping
# ────────────────────────────────────────────────────────────────
best_val_loss = np.inf
epochs = 50
patience = 5
patience_counter = 0

for epoch in range(epochs):
    model.train()
    train_loss = 0
    for Xb, yb in train_loader:
        optimizer.zero_grad()
        preds = model(Xb)
        loss = criterion(preds, yb)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()

    # Validation
    model.eval()
    val_loss = 0
    with torch.no_grad():
        for Xv, yv in val_loader:
            vp = model(Xv)
            val_loss += criterion(vp, yv).item()
    val_loss /= len(val_loader)

    print(f"Epoch {epoch+1:02d} - Train Loss: {train_loss/len(train_loader):.6f} | Val Loss: {val_loss:.6f}")

    # Early stopping
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        patience_counter = 0
        torch.save(model.state_dict(), "best_lstm_model.pt")
    else:
        patience_counter += 1
        if patience_counter >= patience:
            print("⏹️ Early stopping triggered.")
            break

# ────────────────────────────────────────────────────────────────
# 7. Evaluation
# ────────────────────────────────────────────────────────────────
# Load best model
model.load_state_dict(torch.load("best_lstm_model.pt"))
model.eval()

with torch.no_grad():
    pred = model(X_test_t).numpy().flatten()
    y_true = y_test_t.numpy().flatten()
    rmse = np.sqrt(mean_squared_error(y_true, pred))
    directional = (np.sign(pred) == np.sign(y_true)).mean()

print(f"\n📉 Final RMSE (PyTorch LSTM): {rmse:.6f}")
print(f"📈 Final Directional Accuracy: {directional:.2%}")
