import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, FormControl,
  InputLabel, Select, MenuItem, Grid,
} from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import axios from 'axios';

const CRYPTO_SYMBOLS = ['BTC','ETH','BNB','XRP','SOL'];
const FEATURES       = ['price','volume','sentiment','macd'];

function Charts() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [selectedFeature, setSelectedFeature] = useState('price');
  const [chartData, setChartData] = useState([]);
  const [macdData, setMacdData]     = useState({ macd:[], signal:[], histogram:[] });
  const [keyMetrics, setKeyMetrics] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/charts/${selectedCrypto}`);
        setChartData(data.historical_data);
        setMacdData(data.macd);
        const latest = data.historical_data.slice(-1)[0];
        setKeyMetrics({
          currentPrice: latest.close,
          priceChange: ((latest.close - data.historical_data[0].close)/data.historical_data[0].close*100).toFixed(2),
          volume24h: latest.volume,
          sentiment: latest.sentiment_num,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedCrypto]);

  // ─── EARLY-RETURN GUARD ─────────────────────────────────────────────────────
  if (!chartData?.length) {
    return <Typography>Loading chart…</Typography>;
  }

  return (
    <Box sx={{ p:3 }}>
      <Grid container spacing={3}>

        {/* Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p:2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Crypto</InputLabel>
                  <Select
                    value={selectedCrypto}
                    label="Crypto"
                    onChange={e=>setSelectedCrypto(e.target.value)}
                  >
                    {CRYPTO_SYMBOLS.map(sym=>(
                      <MenuItem key={sym} value={sym}>{sym}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Feature</InputLabel>
                  <Select
                    value={selectedFeature}
                    label="Feature"
                    onChange={e=>setSelectedFeature(e.target.value)}
                  >
                    {FEATURES.map(ft=>(
                      <MenuItem key={ft} value={ft}>
                        {ft.charAt(0).toUpperCase()+ft.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p:2, height:400 }}>
            <ResponsiveContainer width="100%" height="100%">
              {selectedFeature !== 'macd' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={v=>new Date(v).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={v=>new Date(v).toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey={selectedFeature} stroke="#8884d8" />
                  {selectedFeature==='price' && (
                    <Line
                      type="monotone"
                      dataKey="predicted_price"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              ) : (
                macdData.macd.length>0 && (
                  <LineChart
                    data={chartData.map((row,i)=>({
                      timestamp:  row.timestamp,
                      macd:       macdData.macd[i],
                      signal:     macdData.signal[i],
                      histogram:  macdData.histogram[i],
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={v=>new Date(v).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={v=>new Date(v).toLocaleString()} />
                    <Legend />
                    <Line type="monotone" dataKey="macd"      stroke="#8884d8" />
                    <Line type="monotone" dataKey="signal"    stroke="#82ca9d" />
                    <Line type="monotone" dataKey="histogram" stroke="#ffc658" />
                  </LineChart>
                )
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6">Key Metrics</Typography>
            <Box sx={{ mt:2 }}>
              <Typography>
                Current Price: ${keyMetrics.currentPrice?.toFixed(2)}
              </Typography>
              <Typography color={keyMetrics.priceChange>=0?'success.main':'error.main'}>
                24h Change: {keyMetrics.priceChange}%
              </Typography>
              <Typography>
                24h Volume: ${keyMetrics.volume24h?.toLocaleString()}
              </Typography>
              <Typography>
                Sentiment: {keyMetrics.sentiment?.toFixed(2)}
              </Typography>
            </Box>

            <Typography variant="h6" sx={{ mt:4 }}>MACD Signal</Typography>
            <Box sx={{ mt:2 }}>
              <Typography>
                MACD:{' '}
                {macdData.macd.length
                  ? macdData.macd.slice(-1)[0].toFixed(4)
                  : '—'}
              </Typography>
              <Typography>
                Signal:{' '}
                {macdData.signal.length
                  ? macdData.signal.slice(-1)[0].toFixed(4)
                  : '—'}
              </Typography>
              <Typography>
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
