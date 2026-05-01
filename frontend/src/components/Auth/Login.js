// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Divider
} from '@mui/material';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login({ phone_number: phone, password });
        
        if (result.success) {
            // Redirect based on role
            if (result.user.role === 'driver') {
                navigate('/driver');
            } else {
                navigate('/passenger');
            }
        } else {
            setError(result.error || 'Login failed. Please check your credentials.');
        }
        
        setLoading(false);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ 
                mt: 8, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
            }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                        🚍 Lesotho Transport Payment
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
                        Login to your account
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            variant="outlined"
                            margin="normal"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            placeholder="e.g., 58881234"
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            OR
                        </Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Don't have an account?
                        </Typography>
                        <Button
                            component={Link}
                            to="/register"
                            variant="outlined"
                            color="secondary"
                            size="large"
                            sx={{ mt: 1, py: 1 }}
                            fullWidth
                        >
                            Create New Account
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Login;