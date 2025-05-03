import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Slider,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import axios from 'axios';

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'];
const TIME_INTERVALS = ['1h', '4h', '1d'];

function Quiz() {
  const navigate = useNavigate();
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [timeInterval, setTimeInterval] = useState('1h');
  const [chartData, setChartData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/charts/${selectedCrypto}`);
        setChartData(response.data.historical_data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [selectedCrypto]);

  const handlePrediction = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/predict', {
        user_id: userId,
        crypto_symbol: selectedCrypto,
        predicted_price: prediction,
        prediction_time: new Date().toISOString(),
      });

      setResult(response.data);
    } catch (error) {
      console.error('Error submitting prediction:', error);
    }
  };

  const handleMouseMove = (e) => {
    if (e && e.activePayload) {
      const { value } = e.activePayload[0];
      setPrediction(value);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Crypto</InputLabel>
                  <Select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                  >
                    {CRYPTO_SYMBOLS.map((symbol) => (
                      <MenuItem key={symbol} value={symbol}>
                        {symbol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Interval</InputLabel>
                  <Select
                    value={timeInterval}
                    onChange={(e) => setTimeInterval(e.target.value)}
                  >
                    {TIME_INTERVALS.map((interval) => (
                      <MenuItem key={interval} value={interval}>
                        {interval}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                onMouseMove={handleMouseMove}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <ReferenceLine
                  x={new Date().toISOString()}
                  stroke="red"
                  label="Now"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Make Your Prediction
            </Typography>
            {!isLoggedIn && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please login to make predictions and earn points!
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                Predicted Price: {prediction ? `$${prediction.toFixed(2)}` : 'Hover over the chart'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePrediction}
                disabled={!prediction || !isLoggedIn}
              >
                Submit Prediction
              </Button>
            </Box>
            {result && (
              <Box sx={{ mt: 2 }}>
                <Alert severity={result.points_earned > 50 ? 'success' : 'warning'}>
                  Actual Price: ${result.actual_price.toFixed(2)}
                  <br />
                  Points Earned: {result.points_earned}
                </Alert>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Quiz; 