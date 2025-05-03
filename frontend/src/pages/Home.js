import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
} from '@mui/material';
import {
  ShowChart as ChartIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
          color: 'white',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to Crypto Prediction App
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 4 }}>
          Explore cryptocurrency trends, make predictions, and test your trading skills
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              size="large"
              startIcon={<ChartIcon />}
              onClick={() => navigate('/charts')}
              sx={{
                minWidth: 200,
                height: 100,
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                },
              }}
            >
              View Charts
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              size="large"
              startIcon={<QuizIcon />}
              onClick={() => navigate('/quiz')}
              sx={{
                minWidth: 200,
                height: 100,
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #FF4081 30%, #FF80AB 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #F50057 30%, #FF4081 90%)',
                },
              }}
            >
              Start Quiz
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Features:
          </Typography>
          <ul>
            <li>
              <Typography>
                Real-time cryptocurrency charts with technical indicators
              </Typography>
            </li>
            <li>
              <Typography>
                Interactive prediction quiz with leaderboard
              </Typography>
            </li>
            <li>
              <Typography>
                Latest cryptocurrency news and updates
              </Typography>
            </li>
            <li>
              <Typography>
                MACD signals and other trading indicators
              </Typography>
            </li>
          </ul>
        </Box>
      </Paper>
    </Container>
  );
}

export default Home; 