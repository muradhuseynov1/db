# Crypto Prediction App

A web application for cryptocurrency price prediction and analysis, featuring real-time charts, technical indicators, and a gamified prediction system.

## Features

- Real-time cryptocurrency charts with technical indicators (MACD, etc.)
- Interactive price prediction quiz with leaderboard
- Latest cryptocurrency news feed
- User authentication and registration
- Responsive and modern UI

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd crypto-prediction-app
```

2. Set up the Python backend:
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

3. Set up the React frontend:
```bash
cd frontend
npm install
```

## Running the Application

1. Start the Flask backend:
```bash
# From the root directory
python app/__init__.py
```

2. Start the React frontend:
```bash
# From the frontend directory
npm start
```

The application will be available at `http://localhost:3000`.

## API Keys

You'll need to obtain API keys for:
- NewsAPI (https://newsapi.org/)
- Binance (https://www.binance.com/)

Add these to your `.env` file:
```
NEWSAPI_KEY=your_newsapi_key
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
```

## Project Structure

```
crypto-prediction-app/
├── app/                    # Flask backend
│   ├── __init__.py        # Flask application
│   ├── models.py          # Database models
│   ├── routes.py          # API routes
│   └── utils.py           # Utility functions
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   └── App.js        # Main application
│   └── package.json
├── requirements.txt       # Python dependencies
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 