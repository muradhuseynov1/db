from flask import Blueprint, json, jsonify, request, current_app
from flask_cors import cross_origin
from .models import db, User, Prediction
import os
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
@cross_origin()
def get_charts(crypto_symbol):
    # 1) load CSV from project root (drop the bogus 'backend' folder)
    base = os.path.dirname(os.path.dirname(__file__))  
    path = os.path.join(base, 'backend', 'data', 'crypto_news_price_ohlc_dataset.csv')

    # 2) filter for symbol
    df = pd.read_csv(path, parse_dates=['timestamp'])
    df = df[df['coin'] == crypto_symbol]
    current_app.logger.debug(f"get_charts: {crypto_symbol} → {len(df)} rows")

    # 3) rename price_usd→price for your front-end
    if 'price_usd' in df.columns:
        df = df.rename(columns={'price_usd':'price'})

    # 4) inject the fields your React component expects
    #    — if you have real volume or sentiment in your CSV you can
    #      rename/use those; otherwise placeholders:

    if 'volume_24h' in df.columns:
        df = df.rename(columns={'volume_24h': 'volume'})
    df['volume']    = df.get('volume', 0)           # placeholder zero if no column
    df['sentiment'] = df.get('sentiment_num', 0)    # or df['sentiment_num'] if present


    # 5) MACD
    macd = get_macd(df)

    # 6) Costruiamo un JSON serializzabile
    response_payload = {
        'historical_data': json.loads(
            df.to_json(orient='records', date_format='iso')  # ← timestamp in ISO
        ),
        # convertiamo le Series/ndarray in liste di float nativi
        'macd': {k: [float(x) for x in v] for k, v in macd.items()},
        'predictions': []
    }
    return jsonify(response_payload), 200

@main_bp.route('/api/news', methods=['GET'])
@cross_origin()
def get_news():
    try:
        news = fetch_news()
    except Exception as e:
        # log the underlying error so you can diagnose it, but don't 500
        current_app.logger.error(f"📰 fetch_news failed: {e}")
        news = []
    return jsonify(news), 200