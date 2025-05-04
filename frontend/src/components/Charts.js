// Charts.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CardActionArea
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const coinOptions = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'];

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0A0F1A', paper: '#131A30' },
    primary: { main: '#00E099' },
    secondary: { main: '#FF66CC' },
    text: { primary: '#E1E8F1', secondary: '#7A8A99' }
  },
  typography: {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    h2: { fontWeight: 700 },
    h5: { fontWeight: 600 }
  }
});

export default function Charts() {
  const [coin, setCoin] = useState('BTC');
  const [chartData, setChartData] = useState([]);
  const [macdData, setMacdData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/charts/${coin}`);
        let data = res.data;
        if (typeof data === 'string') {
          const clean = data.replace(/\bNaN\b/g, 'null');
          data = JSON.parse(clean);
        }
        // —— YOUR FETCH + NORMALIZATION LOGIC IS HERE UNCHANGED —— //
        const historicalData = Array.isArray(data.historical_data)
          ? data.historical_data
          : [];
        const macdResponse = data.macd || {};

        const normalized = historicalData.map((d) => {
          const close = d.close ?? d.price ?? d.price_usd ?? null;
          const open = d.open ?? close;
          const high = d.high ?? close;
          const low = d.low ?? close;
          return { timestamp: d.timestamp, open, high, low, close };
        });
        const cleaned = normalized.filter((d) => d.timestamp && typeof d.close === 'number');
        setChartData(cleaned);

        const { macd: macdArr, signal, histogram } = macdResponse;
        if (
          Array.isArray(macdArr) &&
          macdArr.length === cleaned.length &&
          Array.isArray(signal) &&
          Array.isArray(histogram)
        ) {
          const md = cleaned.map((row, idx) => ({
            timestamp: row.timestamp,
            macd: macdArr[idx],
            signal: signal[idx],
            histogram: histogram[idx]
          }));
          setMacdData(md);
        } else {
          setMacdData([]);
        }
      } catch {
        setChartData([]);
        setMacdData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [coin]);

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/news') // point this at your backend route that calls fetch_news()
      .then(res => {
        if (isMounted) setNews(res.data.slice(0, 20)); // keep up to 20
      })
      .catch(console.error);

    // rotate every 7 seconds
    const timer = setInterval(() => {
      setNewsIndex(i => (i + 4) % news.length);
    }, 7000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [news.length]);

  const visibleNews = news.slice(newsIndex, newsIndex + 4);


  // Quick sparkline change %
  const latest = chartData[chartData.length - 1] || {};
  const prev   = chartData[chartData.length - 2] || latest;
  const change = prev.close
    ? ((latest.close - prev.close) / prev.close) * 100
    : 0;

  // Period high/low
  const periodHigh = chartData.length
    ? Math.max(...chartData.map(d => d.high))
    : 0;
  const periodLow = chartData.length
    ? Math.min(...chartData.map(d => d.low))
    : 0;

  // Last 10 data points for table
  const tableRows = useMemo(() => {
    return chartData.slice(-10).map((d, idx) => ({
      id: idx,
      timestamp: d.timestamp,
      open:   d.open,
      high:   d.high,
      low:    d.low,
      close:  d.close
    }));
  }, [chartData]);
  console.log('🔍 tableRows:', tableRows.map(r => ({
    open: typeof r.open, high: typeof r.high, low: typeof r.low, close: typeof r.close
  })));

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ p: 3, background: 'background.default', minHeight: '100vh' }}>
        {/* HEADER */}
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h2">Crypto Dashboard</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Live charts & metrics for {coin}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Select
              value={coin}
              onChange={e => setCoin(e.target.value)}
              sx={{
                color: 'text.primary',
                '.MuiSelect-icon': { color: 'text.primary' },
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' }
              }}
            >
              {coinOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <CircularProgress color="secondary" size={60} />
          </Box>
        ) : !chartData.length ? (
          <Typography sx={{ mt: 4 }}>No data for {coin}</Typography>
        ) : (
          <>
            {/* SUMMARY SPARKLINE */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
                mt: 4,
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'background.paper'
              }}
            >
              <Box>
                <Typography variant="h3">
                  {latest.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: change >= 0 ? '#00E099' : '#FF4D4F' }}
                >
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </Typography>
              </Box>
              <Box sx={{ width: 400, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-80)}>
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke={darkTheme.palette.primary.main}
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* METRICS CARDS */}
            <Grid container spacing={2} mb={4}>
              {[
                { label: 'Open', value: latest.open },
                { label: 'High', value: latest.high },
                { label: 'Low', value: latest.low },
                { label: 'Close', value: latest.close },
                { label: 'Period High', value: periodHigh },
                { label: 'Period Low', value: periodLow }
              ].map(m => (
                <Grid item xs={12} sm={6} md={4} key={m.label}>
                  <Card sx={{ background: 'background.paper' }}>
                    <CardHeader
                      title={m.label}
                      titleTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                    />
                    <CardContent>
                      <Typography variant="h5">
                        {m.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* PRICE CHART */}
            <Paper elevation={2} sx={{ p: 2, mb: 4, height: 550 }}>
              <Typography variant="h5" gutterBottom>
                Price History
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="10%" stopColor="#00E099" stopOpacity={0.6}/>
                      <stop offset="90%" stopColor="#00E099" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis
                    tickFormatter={v => v.toLocaleString()}
                    axisLine={false}
                    tickLine={false}
                  />
                  <CartesianGrid strokeDasharray="4 4" stroke="#1F2A3D" />
                  <Tooltip
                    contentStyle={{ background: '#131A30', border: 'none' }}
                    labelStyle={{ color: '#E1E8F1' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={darkTheme.palette.primary.main}
                    fill="url(#grad1)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>

            {/* MACD & HISTOGRAM */}
            <Paper elevation={2} sx={{ p: 2, mb: 4, height: 600 }}>
              <Typography variant="h5" gutterBottom>
                MACD & Signal
              </Typography>
              <ResponsiveContainer width="100%" height="45%">
                <LineChart data={macdData}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v.toFixed(2)}
                  />
                  <CartesianGrid strokeDasharray="4 4" stroke="#1F2A3D" />
                  <Tooltip
                    contentStyle={{ background: '#131A30', border: 'none' }}
                    labelStyle={{ color: '#E1E8F1' }}
                  />
                  <Legend wrapperStyle={{ color: '#E1E8F1' }} />
                  <Line
                    type="monotone"
                    dataKey="macd"
                    stroke="#FFAA00"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="signal"
                    stroke="#0099FF"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
              <Divider sx={{ my: 2, borderColor: '#1F2A3D' }} />
              <Typography variant="h6" gutterBottom>
                MACD Histogram
              </Typography>
              <ResponsiveContainer width="100%" height="45%">
                <BarChart data={macdData}>
                  <Bar dataKey="histogram" fill={darkTheme.palette.secondary.main} />
                  <CartesianGrid strokeDasharray="4 4" stroke="#1F2A3D" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#131A30', border: 'none' }}
                    labelStyle={{ color: '#E1E8F1' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            <Paper
          elevation={4}
          sx={{
            p: 3,
            
            color: 'white'
          }}
        >
           {/* ─── Last 10 Data Points ───────────────────────────────────────────── */}

          <Paper
            elevation={3}
            sx={{
              p: 3,
              
              color:    'white',
              borderRadius: 2
            }}
          >
            <Typography variant="h5" gutterBottom>
              Last 10 Data Points
            </Typography>
            <Box sx={{ height: 380, width: '100%' }}>
              <DataGrid
                rows={tableRows}
                columns={[
                  {
                    field: 'timestamp',
                    headerName: 'Timestamp',
                    flex: 2,
                    headerAlign: 'left',
                    align: 'left'
                  },
                  {
                    field: 'open',
                    headerName: 'Open',
                    flex: 1,
                    headerAlign: 'right',
                    align: 'right',
                    renderCell: params => {
                      const v = Number(params.row.open);
                      return Number.isFinite(v) ? v.toFixed(2) : '—';
                    }
                  },
                  {
                    field: 'high',
                    headerName: 'High',
                    flex: 1,
                    headerAlign: 'right',
                    align: 'right',
                    renderCell: params => {
                      const v = Number(params.row.high);
                      return Number.isFinite(v) ? v.toFixed(2) : '—';
                    }
                  },
                  {
                    field: 'low',
                    headerName: 'Low',
                    flex: 1,
                    headerAlign: 'right',
                    align: 'right',
                    renderCell: params => {
                      const v = Number(params.row.low);
                      return Number.isFinite(v) ? v.toFixed(2) : '—';
                    }
                  },
                  {
                    field: 'close',
                    headerName: 'Close',
                    flex: 1,
                    headerAlign: 'right',
                    align: 'right',
                    renderCell: params => {
                      const v = Number(params.row.close);
                      return Number.isFinite(v) ? v.toFixed(2) : '—';
                    }
                  }
                ]}
                pageSize={5}
                rowsPerPageOptions={[5]}
                hideFooter
                disableSelectionOnClick
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: '#273447',
                    color:  '#fff',
                    fontSize: '1rem',
                    fontWeight: 600
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    bgcolor: '#1E2733'
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    bgcolor: '#2A3748'
                  },
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                    bgcolor: '#1E2733'
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: 'none',
                    color: '#E0E0E0'
                  },
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: '#33425A !important'
                  }
                }}
              />
            </Box>
          </Paper>

            </Paper>

            {/* MARKET OVERVIEW */}
            <Typography variant="h5" sx={{ mb: 2 }}>
              Market Overview
            </Typography>
            <Grid container spacing={2} mb={4}>
              {['BTC','ETH','BNB','XRP','SOL'].map((c, i) => (
                <Grid item xs={12} sm={6} md={2.4} key={c}>
                  <Card sx={{ background: 'background.paper' }}>
                    <CardHeader
                      title={c}
                      titleTypographyProps={{ variant: 'subtitle1' }}
                    />
                    <CardContent>
                      <Typography variant="h6">
                        {/* dummy values, wire this up to a real API later */}
                        {(Math.random()*100).toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        24h Change
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h5" gutterBottom>📰 Latest Crypto News</Typography>
      {visibleNews.length === 0 ? (
        <Typography>Loading news…</Typography>
      ) : (
        <Grid container spacing={2} mb={4}>
          {visibleNews.map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea href={item.url} target="_blank" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' '}— {item.source}
                    </Typography>
                    <Typography variant="body1" mt={1}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {item.description?.slice(0, 80)}…
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}
