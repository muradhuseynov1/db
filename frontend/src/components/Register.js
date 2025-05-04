// src/components/Register.js
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
import { getUsers, saveUser, userExists } from '../utils/authStorage';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get('email');
    const username = data.get('username');
    const password = data.get('password');
    const confirm = data.get('confirm');

    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }

    if (userExists(email, username)) {
      alert('A user with this email or username already exists.');
      return;
    }

    const newUser = { email, username, password };
    saveUser(newUser);
    login({ email, username });
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Register
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField name="email" label="Email" type="email" required fullWidth />
          <TextField name="username" label="Username" required fullWidth />
          <TextField name="password" label="Password" type="password" required fullWidth />
          <TextField name="confirm" label="Confirm Password" type="password" required fullWidth />
          <Button variant="contained" type="submit">
            Register
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default Register;
