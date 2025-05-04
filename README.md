# Crypto Prediction App  

A web application for cryptocurrency price prediction, market analysis, and interactive quizzes. This project combines advanced AI technologies like **LSTM models**, **FinBERT for sentiment analysis**, and real-time market data APIs.  

![Crypto Banner](https://via.placeholder.com/1200x400?text=Crypto+Prediction+App)  

---

## Features  

- **Real-time cryptocurrency charts** with technical indicators like MACD.  
- **Gamified prediction quizzes** with a leaderboard to test your market intuition.  
- **AI-powered news sentiment analysis** using FinBERT to assess market trends.  
- **Responsive design** for seamless use across devices.  
- **Secure user authentication** with account management.  

---

## Demo  

👉 [**Live Demo**](https://example.com)  

---

## Technologies  

- **Python** and **Flask** for backend development.  
- **React.js** for frontend UI.  
- **LSTM (Long Short-Term Memory)** models for price prediction.  
- **FinBERT** for sentiment analysis on cryptocurrency news.  
- **Binance API** for real-time market data.  
- **NewsAPI** for fetching cryptocurrency-related news.  

---

## Installation  

### Prerequisites  

Make sure you have the following installed:  

- **Python 3.8+**  
- **Node.js 14+**  
- **npm** or **yarn**  

### 1. Clone the Repository  
```bash
git clone https://github.com/muradhuseynov1/db.git
cd db
```

### 2.  Backend Setup (Flask)
```python
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate


# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your API keys in the .env file
```

### 3.  Frontend Setup (React)
```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend
```bash
python app/__init__.py
```
### Start the Frontend
```bash
cd frontend 
npm start
```

The app will be available at: `http://localhost:3000`

## API Keys
To fully utilize the app, make sure to set up the following API keys in your `.env` file:

- NewsAPI (https://newsapi.org/)
- Binance (https://www.binance.com/)
- 
Example `.env` file:

```env
NEWSAPI_KEY=your_newsapi_key
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
```

## Project Structure
```Code
crypto-prediction-app/
├── app/                    # Backend (Flask)
│   ├── __init__.py         # Flask app entry-point
│   ├── models.py           # Database models
│   ├── routes.py           # API routes
│   └── utils.py            # Helper functions
├── frontend/               # Frontend (React)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main app file
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

## Contributing
Contributions are welcome!

1. Fork the repository.
2. Create a branch for your feature:
```bash
git checkout -b feature/your-feature-name
```
3. Commit your changes:
```bash
git commit -m "Add your feature description"
```
4. Push to your branch:
```bash
git push origin feature/your-feature-name
```
5. Open a Pull Request and describe your changes.
