from flask import Blueprint, jsonify, request
from .models import db, User, Prediction
from datetime import datetime
import torch
import pandas as pd
import numpy as np
from .utils import preprocess_data, get_macd, fetch_news

main_bp = Blueprint('main', __name__)

# Load the LSTM model
model = torch.load('best_lstm_model.pt')
model.eval()

@main_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(username=username, password=password)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@main_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username, password=password).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    return jsonify({'message': 'Login successful', 'user_id': user.id}), 200

@main_bp.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    user_id = data.get('user_id')
    crypto_symbol = data.get('crypto_symbol')
    predicted_price = data.get('predicted_price')
    prediction_time = datetime.fromisoformat(data.get('prediction_time'))
    
    # Get actual price from Binance API
    actual_price = get_current_price(crypto_symbol)
    
    # Calculate points based on prediction accuracy
    accuracy = abs(predicted_price - actual_price) / actual_price
    points = int((1 - accuracy) * 100)  # Max 100 points for perfect prediction
    
    prediction = Prediction(
        user_id=user_id,
        crypto_symbol=crypto_symbol,
        predicted_price=predicted_price,
        actual_price=actual_price,
        prediction_time=prediction_time,
        points_earned=points
    )
    
    # Update user's total points
    user = User.query.get(user_id)
    user.points += points
    
    db.session.add(prediction)
    db.session.commit()
    
    return jsonify({
        'message': 'Prediction recorded',
        'actual_price': actual_price,
        'points_earned': points
    }), 201

@main_bp.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    users = User.query.order_by(User.points.desc()).limit(10).all()
    return jsonify([{
        'username': user.username,
        'points': user.points
    } for user in users]), 200

@main_bp.route('/api/charts/<crypto_symbol>', methods=['GET'])
def get_charts(crypto_symbol):
    # Get historical data
    df = pd.read_csv('crypto_news_price_ohlc_dataset.csv')
    crypto_data = df[df['coin'] == crypto_symbol]
    
    # Calculate MACD
    macd_data = get_macd(crypto_data)
    
    # Get predictions
    predictions = make_predictions(crypto_data)
    
    return jsonify({
        'historical_data': crypto_data.to_dict('records'),
        'macd': macd_data,
        'predictions': predictions
    }), 200

@main_bp.route('/api/news', methods=['GET'])
def get_news():
    news = fetch_news()
    return jsonify(news), 200 