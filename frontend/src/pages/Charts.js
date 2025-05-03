import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
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
} from 'recharts';
import axios from 'axios';

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'];
const FEATURES = ['price', 'volume', 'sentiment', 'macd'];

function Charts() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedFeature, setSelectedFeature] = useState('price');
  const [chartData, setChartData] = useState([]);
  const [macdData, setMacdData] = useState({});
  const [keyMetrics, setKeyMetrics] = useState({});

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/charts/${selectedCrypto}`);
        const { historical_data, macd } = response.data;
        
        setChartData(historical_data);
        setMacdData(macd);
        
        // Calculate key metrics
        const latest = historical_data[historical_data.length - 1];
        const metrics = {
          currentPrice: latest.close,
          priceChange: ((latest.close - historical_data[0].close) / historical_data[0].close * 100).toFixed(2),
          volume24h: latest.volume,
          sentiment: latest.sentiment_num,
        };
        setKeyMetrics(metrics);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [selectedCrypto]);

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
                  <InputLabel>Feature</InputLabel>
                  <Select
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                  >
                    {FEATURES.map((feature) => (
                      <MenuItem key={feature} value={feature}>
                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  dataKey={selectedFeature}
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                {selectedFeature === 'price' && (
                  <Line
                    type="monotone"
                    dataKey="predicted_price"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Current Price: ${keyMetrics.currentPrice?.toFixed(2)}
              </Typography>
              <Typography
                variant="body1"
                color={keyMetrics.priceChange >= 0 ? 'success.main' : 'error.main'}
              >
                24h Change: {keyMetrics.priceChange}%
              </Typography>
              <Typography variant="body1">
                24h Volume: ${keyMetrics.volume24h?.toLocaleString()}
              </Typography>
              <Typography variant="body1">
                Sentiment Score: {keyMetrics.sentiment?.toFixed(2)}
              </Typography>
            </Box>

            <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
              MACD Signal
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                MACD: {macdData.macd?.slice(-1)[0]?.toFixed(4)}
              </Typography>
              <Typography variant="body1">
                Signal: {macdData.signal?.slice(-1)[0]?.toFixed(4)}
              </Typography>
              <Typography variant="body1">
                Histogram: {macdData.histogram?.slice(-1)[0]?.toFixed(4)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Charts; 