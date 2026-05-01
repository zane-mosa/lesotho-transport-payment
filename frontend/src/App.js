// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PassengerDashboard from './pages/Passenger/Dashboard';
import DriverDashboard from './pages/Driver/Dashboard';
// a) Add import
import ConfirmPayment from './pages/Driver/ConfirmPayment';
// Add OwnerDashboard import
import OwnerDashboard from './pages/Owner/Dashboard';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

// Create theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#2E7D32', // Lesotho green
        },
        secondary: {
            main: '#FFA000', // Amber/gold
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});

// Navigation component
function Navigation() {
    const { user, logout } = useAuth();

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    🚍 Lesotho Transport Payment
                </Typography>
                {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1">
                            👤 {user.name} ({user.role})
                        </Typography>
                        <Button color="inherit" onClick={logout} variant="outlined">
                            Logout
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}

// Routes component
function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <Typography variant="h6">Loading...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <>
            <Navigation />
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Routes>
                    <Route 
                        path="/login" 
                        element={!user ? <Login /> : <Navigate to={user.role === 'driver' ? '/driver' : user.role === 'owner' ? '/owner' : '/passenger'} />} 
                    />
                    <Route 
                        path="/register" 
                        element={!user ? <Register /> : <Navigate to={user.role === 'driver' ? '/driver' : user.role === 'owner' ? '/owner' : '/passenger'} />} 
                    />
                    <Route 
                        path="/passenger" 
                        element={user && user.role === 'passenger' ? <PassengerDashboard /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/driver" 
                        element={user && user.role === 'driver' ? <DriverDashboard /> : <Navigate to="/login" />} 
                    />
                    {/* b) Add route */}
                    <Route 
                        path="/driver/confirm/:reference" 
                        element={user && user.role === 'driver' ? <ConfirmPayment /> : <Navigate to="/login" />} 
                    />
                    {/* Add Owner route */}
                    <Route 
                        path="/owner" 
                        element={user && user.role === 'owner' ? <OwnerDashboard /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/" 
                        element={<Navigate to={user ? (user.role === 'driver' ? '/driver' : user.role === 'owner' ? '/owner' : '/passenger') : '/login'} />} 
                    />
                </Routes>
            </Container>
        </>
    );
}

// Main App component
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;