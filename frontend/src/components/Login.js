// src/components/Login.js
import React from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../utils/authStorage';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

    const users = getUsers();
    const matchedUser = users.find(
      (user) =>
        user.email === email &&
        user.password === password
    );

    if (!matchedUser) {
      alert('Invalid credentials. Please register first or check your login.');
      return;
    }

    login({ email });
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField name="email" label="Email" type="email" required fullWidth />
          <TextField name="password" label="Password" type="password" required fullWidth />
          <Button variant="contained" type="submit">
            Login
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default Login;
