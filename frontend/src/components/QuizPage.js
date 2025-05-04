// src/components/Quiz.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import axios from 'axios';

export default function Quiz() {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const CHART_MARGIN = { top: 20, right: 20, bottom: 30, left: 50 };

  // quiz state
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [chartData, setChartData]         = useState([]);
  const [cutoffTimestamp, setCutoffTimestamp] = useState(new Date().toISOString());
  const [prediction, setPrediction]       = useState(null);
  const [result, setResult]               = useState(null);
  const [showAverage, setShowAverage]     = useState(true);
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [userId, setUserId]               = useState(null);

  // styling colors
  const COLORS = {
    chart:      '#4ade80',  // bright green
    cutoff:     '#ef4444',  // red
    prediction: '#3b82f6',  // blue
    average:    '#facc15',  // yellow
  };

  // compute initial cutoff at 60%
  const initialCutoff = useMemo(() => {
    if (!chartData.length) return new Date().toISOString();
    const a = chartData[0].timestamp;
    const b = chartData[chartData.length - 1].timestamp;
    return new Date(a + (b - a) * 0.6).toISOString();
  }, [chartData]);

  // whenever chartData loads, reset cutoff/prediction
  useEffect(() => {
    if (chartData.length) {
      setCutoffTimestamp(initialCutoff);
      setPrediction(null);
      setResult(null);
    }
  }, [initialCutoff, chartData]);

  // fetch the historical_data
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/charts/${selectedCrypto}`)
      .then(resp => {
        setChartData(
          resp.data.historical_data.map(r => ({
            ...r,
            timestamp: new Date(r.timestamp).getTime()
          }))
        );
      })
      .catch(console.error);
  }, [selectedCrypto]);

  // login state from localStorage
  useEffect(() => {
    const uid = localStorage.getItem('userId');
    if (uid) {
      setIsLoggedIn(true);
      setUserId(uid);
    }
  }, []);

  // numeric helpers
  const cutoffTimeNum = new Date(cutoffTimestamp).getTime();
  const displayedData = useMemo(
    () =>
      chartData.map(d =>
        d.timestamp > cutoffTimeNum ? { ...d, close: null } : d
      ),
    [chartData, cutoffTimeNum]
  );
  const [yMin, yMax] = useMemo(() => {
    if (!chartData.length) return [0, 1];
    const vals = chartData.map(d => d.close);
    return [Math.min(...vals), Math.max(...vals)];
  }, [chartData]);
  const xDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto'];
    const start = chartData[0].timestamp;
    return [start, cutoffTimeNum + 3600_000];
  }, [chartData, cutoffTimeNum]);
  const averagePrice = useMemo(() => {
    if (!showAverage) return null;
    const valid = chartData.filter(d => d.timestamp <= cutoffTimeNum);
    if (!valid.length) return null;
    return valid.reduce((sum, d) => sum + d.close, 0) / valid.length;
  }, [chartData, cutoffTimeNum, showAverage]);

  // reset prediction
  const resetChart = () => {
    setPrediction(null);
    setResult(null);
    setCutoffTimestamp(initialCutoff);
  };

  // handle click to predict
  const handleWrapperClick = e => {
    const { offsetX, offsetY } = e.nativeEvent;
    const rect = e.currentTarget.getBoundingClientRect();
    const plotW = rect.width - CHART_MARGIN.left - CHART_MARGIN.right;
    const plotH = rect.height - CHART_MARGIN.top - CHART_MARGIN.bottom;
    if (
      offsetX < CHART_MARGIN.left ||
      offsetX > CHART_MARGIN.left + plotW ||
      offsetY < CHART_MARGIN.top ||
      offsetY > CHART_MARGIN.top + plotH
    )
      return;

    const [xMin, xMax] = xDomain;
    const ts = xMin + ((offsetX - CHART_MARGIN.left) / plotW) * (xMax - xMin);
    if (ts <= cutoffTimeNum) return;

    const price = yMax - ((offsetY - CHART_MARGIN.top) / plotH) * (yMax - yMin);
    setPrediction({ timestamp: ts, price });
    setResult(null);
  };

  // custom tooltip shows only prediction area
  const CustomTooltip = ({ active, payload, label }) => {
    // only show when tooltip is active
    if (!active) return null;
  
    // pull out the value
    const val = payload?.[0]?.value;
  
    // guard: must be numeric and to the right of cutoff
    if (typeof val !== 'number' || label <= cutoffTimeNum) {
      return null;
    }
  
    return (
      <Box
        sx={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          border: '1px solid #ccc',
          p: 1,
          pointerEvents: 'none',
        }}
      >
        <Typography variant="caption">
          {new Date(label).toLocaleString()}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          Close: ${val.toFixed(2)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#0F111A', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom color="white">
        Interactive Prediction Quiz
      </Typography>
      <Typography variant="body2" color="grey.400" gutterBottom>
        Select a cryptocurrency, set your cutoff, then click on the right half of the chart to predict its future price.
      </Typography>

      {/* Controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'grey.300' }}>Crypto</InputLabel>
            <Select
              value={selectedCrypto}
              onChange={e => setSelectedCrypto(e.target.value)}
              sx={{
                backgroundColor: '#1E293B',
                color: 'white',
              }}
              label="Crypto"
            >
              {['BTC','ETH','BNB','XRP','SOL'].map(sym => (
                <MenuItem key={sym} value={sym}>{sym}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Cutoff Time"
            type="datetime-local"
            fullWidth
            value={cutoffTimestamp.slice(0,16)}
            onChange={e => {
              const d = new Date(e.target.value);
              if (!isNaN(d)) setCutoffTimestamp(d.toISOString());
            }}
            InputLabelProps={{ shrink: true }}
            sx={{
              backgroundColor: '#1E293B',
              input: { color: 'white' },
              label: { color: 'grey.300' },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4} alignItems="center" display="flex">
          <FormControlLabel
            control={
              <Checkbox
                checked={showAverage}
                onChange={e => setShowAverage(e.target.checked)}
                sx={{
                  color: 'grey.300',
                  '&.Mui-checked': { color: COLORS.average }
                }}
              />
            }
            label={<Typography color="grey.300">Show Average</Typography>}
          />
        </Grid>
      </Grid>

      {/* Chart */}
      <Paper sx={{ p: 2, mb: 3, height: 500, backgroundColor: '#1C1F2A' }} elevation={4}>
        <Box
          sx={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          onClick={handleWrapperClick}
        >
          <ResponsiveContainer>
            <LineChart
              ref={chartRef}
              data={displayedData}
              margin={CHART_MARGIN}
            >
              <CartesianGrid stroke="#2A2D39" />
              <XAxis
                dataKey="timestamp"
                domain={xDomain}
                type="number"
                scale="time"
                tick={{ fill: 'grey' }}
              />
              <YAxis domain={[yMin, yMax]} tick={{ fill: 'grey' }} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend wrapperStyle={{ color: 'white' }} />
              <Line
                type="monotone"
                dataKey="close"
                stroke={COLORS.chart}
                dot={false}
                connectNulls
              />
              <ReferenceLine
                x={cutoffTimeNum}
                stroke={COLORS.cutoff}
                label={{
                  position: 'top',
                  value: 'Cutoff',
                  fill: 'white',
                }}
              />
              {showAverage && averagePrice != null && (
                <ReferenceLine
                  y={averagePrice}
                  stroke={COLORS.average}
                  label={{
                    position: 'right',
                    value: `Avg ${averagePrice.toFixed(2)}`,
                    fill: 'white',
                  }}
                />
              )}
              {prediction && (
                <ReferenceDot
                  x={prediction.timestamp}
                  y={prediction.price}
                  r={6}
                  fill={COLORS.prediction}
                  label={{
                    position: 'top',
                    value: `$${prediction.price.toFixed(2)}`,
                    fill: 'white',
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Prediction & Result */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#1C1F2A' }} elevation={4}>
        {!isLoggedIn && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please log in to submit your prediction.
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography color="white">
            {prediction
              ? `Your Prediction: $${prediction.price.toFixed(2)}`
              : 'Click on the chart to make a prediction.'}
          </Typography>
          <Button variant="contained" onClick={resetChart}>
            Reset
          </Button>
        </Box>

        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity={result.points_earned > 50 ? 'success' : 'warning'}
            >
              Actual: ${result.actual_price.toFixed(2)}<br />
              You earned: {result.points_earned} pts
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
