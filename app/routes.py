from flask import Blueprint, jsonify, request, current_app
from .models import db, User, Prediction
from datetime import datetime
import torch
import pandas as pd
import numpy as np
from .utils import (
    preprocess_data,
    get_macd,
    fetch_news,
    get_current_price,
    generate_features,
    make_predictions
)

main_bp = Blueprint('main', __name__)

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
    df_feat = pd.read_csv('crypto_news_features.csv', parse_dates=['timestamp'])

    # 3) filter to just this symbol (and drop rows missing any features)
    crypto_data = df_feat[df_feat['coin'] == crypto_symbol].dropna(subset=[
        "sentiment_num",
        "ret_5m","ret_15m","ret_30m",
        "vol_5m","vol_15m","vol_30m",
        "sin_hour","cos_hour","pct_return_60m"
    ])

    # 4) MACD on the raw price series
    macd_data = get_macd(crypto_data)

    # 5) predictions now has everything it needs
    predictions = make_predictions(crypto_data)
    
    
    return jsonify({
        'historical_data': crypto_data.to_dict('records'),
        'macd': macd_data,
        'predictions': predictions
    }), 200

@main_bp.route('/api/news', methods=['GET'])
def get_news():
    try:
        news = fetch_news()
    except Exception as e:
        # log the underlying error so you can diagnose it, but don't 500
        current_app.logger.error(f"📰 fetch_news failed: {e}")
        news = []
    return jsonify(news), 200