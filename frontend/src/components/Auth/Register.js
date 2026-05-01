// src/components/Auth/Register.js
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider
} from '@mui/material';

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
        role: 'passenger'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate name
        if (!formData.name || formData.name.trim().length < 2) {
            setError('Please enter a valid name (at least 2 characters)');
            return;
        }
        
        // Validate phone number
        if (!formData.phone_number || formData.phone_number.trim().length < 5) {
            setError('Please enter a valid phone number');
            return;
        }
        
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        
        setLoading(true);

        const result = await register({
            name: formData.name.trim(),
            phone_number: formData.phone_number.trim(),
            password: formData.password,
            role: formData.role
        });
        
        if (result.success) {
            // Redirect based on role
            if (result.user.role === 'driver') {
                navigate('/driver');
            } else if (result.user.role === 'owner') {
                navigate('/owner');
            } else {
                navigate('/passenger');
            }
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }
        
        setLoading(false);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ 
                mt: 4, 
                mb: 4,
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
            }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                        🚍 Create Account
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
                        Join Lesotho Transport Payment System
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            name="name"
                            variant="outlined"
                            margin="normal"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., John Doe"
                        />
                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone_number"
                            variant="outlined"
                            margin="normal"
                            value={formData.phone_number}
                            onChange={handleChange}
                            required
                            placeholder="e.g., 58881234"
                            helperText="Enter any phone number (e.g., 58881234)"
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            helperText="Password must be at least 6 characters"
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>I am a...</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                label="I am a..."
                            >
                                <MenuItem value="passenger">🚌 Passenger - I want to pay for rides</MenuItem>
                                <MenuItem value="driver">🚖 Driver - I want to accept payments</MenuItem>
                                <MenuItem value="owner">🏢 Taxi Owner - I own taxis and manage drivers</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {loading ? 'Creating Account...' : 'Register'}
                        </Button>
                    </form>

                    <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            OR
                        </Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Already have an account?
                        </Typography>
                        <Button
                            component={Link}
                            to="/login"
                            variant="outlined"
                            color="secondary"
                            size="large"
                            sx={{ mt: 1, py: 1 }}
                            fullWidth
                        >
                            Back to Login
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Register;