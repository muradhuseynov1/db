// src/components/Home.js
import React from 'react';
import { Container, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => navigate('/charts')}>
          Charts
        </Button>
        <Button variant="contained" onClick={() => navigate('/quiz')}>
          Quiz
        </Button>
      </Stack>
    </Container>
  );
};

export default Home;
