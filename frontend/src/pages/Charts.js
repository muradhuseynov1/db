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
  const [macdData, setMacdData] = useState({
    macd: [],
    signal: [],
    histogram: []
  });
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

  if (chartData.length === 0) {
    return <Typography>Loading chart…</Typography>;
  }  

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
            {selectedFeature !== 'macd' ? (
              <LineChart data={chartData}>
                {/* … your existing price/volume/sentiment here … */}
                <Line
                  type="monotone"
                  dataKey={selectedFeature}
                  stroke="#8884d8"
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
            ) : (
              <LineChart
                data={chartData.map((row, i) => ({
                  timestamp: row.timestamp,
                  macd: macdData.macd[i],
                  signal: macdData.signal[i],
                  histogram: macdData.histogram[i]
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="macd" stroke="#8884d8" />
                <Line type="monotone" dataKey="signal" stroke="#82ca9d" />
                <Line type="monotone" dataKey="histogram" stroke="#ffc658" />
              </LineChart>
            )}
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
                MACD:{' '}
                {macdData.macd.length
                  ? macdData.macd.slice(-1)[0].toFixed(4)
                  : '—'}
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
                Signal:{' '}
                {macdData.signal.length
                  ? macdData.signal.slice(-1)[0].toFixed(4)
                  : '—'}
              </Typography>
              <Typography variant="body1">
                Histogram:{' '}
                {macdData.histogram.length
                  ? macdData.histogram.slice(-1)[0].toFixed(4)
                  : '—'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Charts; 