// src/pages/Owner/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tab,
    Tabs
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function OwnerDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [openWithdraw, setOpenWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('mpesa');
    const [withdrawPhone, setWithdrawPhone] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);

    const token = localStorage.getItem('token');

    useEffect(() => {
        loadDashboard();
        loadDrivers();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await axios.get(`${API_URL}/owner/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashboard(response.data.dashboard);
            setVehicles(response.data.dashboard.vehicles);
            setLoading(false);
        } catch (error) {
            console.error('Dashboard error:', error);
            setMessage({ type: 'error', text: 'Failed to load dashboard' });
            setLoading(false);
        }
    };

    const loadDrivers = async () => {
        try {
            const response = await axios.get(`${API_URL}/owner/drivers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDrivers(response.data.drivers);
        } catch (error) {
            console.error('Drivers error:', error);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || withdrawAmount < 10) {
            setMessage({ type: 'error', text: 'Minimum withdrawal amount is M10' });
            return;
        }
        if (!withdrawPhone) {
            setMessage({ type: 'error', text: 'Please enter phone number' });
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/owner/withdraw`, {
                amount: parseFloat(withdrawAmount),
                payment_method: withdrawMethod,
                phone_number: withdrawPhone
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage({ type: 'success', text: response.data.message });
            setOpenWithdraw(false);
            setWithdrawAmount('');
            setWithdrawPhone('');
            loadDashboard();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Withdrawal failed' });
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    🏢 Owner Dashboard
                </Typography>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AttachMoneyIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Earnings
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            M {dashboard?.stats?.total_earnings || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <DirectionsBusIcon sx={{ fontSize: 40, color: '#FFA000' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Trips
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {dashboard?.stats?.total_trips || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <PeopleIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Vehicles
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {dashboard?.stats?.total_vehicles || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TrendingUpIcon sx={{ fontSize: 40, color: '#FFA000' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Avg per Vehicle
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            M {dashboard?.stats?.average_per_vehicle || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Withdraw Button */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={<AccountBalanceWalletIcon />}
                        onClick={() => setOpenWithdraw(true)}
                    >
                        Withdraw Earnings
                    </Button>
                </Box>

                {/* Tabs for Vehicles and Transactions */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="Vehicles" />
                        <Tab label="Transactions" />
                    </Tabs>
                </Paper>

                {tabValue === 0 && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            🚕 Your Vehicles
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell><strong>Taxi Number</strong></TableCell>
                                        <TableCell><strong>Route</strong></TableCell>
                                        <TableCell><strong>Driver</strong></TableCell>
                                        <TableCell><strong>Capacity</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {vehicles.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell><strong>{vehicle.taxi_number}</strong></TableCell>
                                            <TableCell>{vehicle.route}</TableCell>
                                            <TableCell>{vehicle.driver_name}</TableCell>
                                            <TableCell>{vehicle.capacity}</TableCell>
                                            <TableCell>
                                                <Chip label={vehicle.status} color="success" size="small" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}

                {tabValue === 1 && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📋 Recent Transactions
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell><strong>Time</strong></TableCell>
                                        <TableCell><strong>Amount</strong></TableCell>
                                        <TableCell><strong>Passenger</strong></TableCell>
                                        <TableCell><strong>Taxi</strong></TableCell>
                                        <TableCell><strong>Driver</strong></TableCell>
                                        <TableCell><strong>Reference</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dashboard?.recent_transactions?.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.time).toLocaleTimeString()}</TableCell>
                                            <TableCell><strong>M {tx.amount}</strong></TableCell>
                                            <TableCell>{tx.passenger_name || 'N/A'}</TableCell>
                                            <TableCell>{tx.taxi_number}</TableCell>
                                            <TableCell>{tx.driver_name}</TableCell>
                                            <TableCell>{tx.reference}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!dashboard?.recent_transactions || dashboard.recent_transactions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No transactions yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Box>

            {/* Withdraw Dialog */}
            <Dialog open={openWithdraw} onClose={() => setOpenWithdraw(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Withdraw Earnings
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Available Balance: M {dashboard?.stats?.total_earnings || 0}
                        </Typography>
                        <TextField
                            fullWidth
                            label="Amount (M)"
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            margin="normal"
                            placeholder="Enter amount to withdraw"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                                value={withdrawMethod}
                                onChange={(e) => setWithdrawMethod(e.target.value)}
                                label="Payment Method"
                            >
                                <MenuItem value="mpesa">📱 M-Pesa</MenuItem>
                                <MenuItem value="ecocash">📱 EcoCash</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            value={withdrawPhone}
                            onChange={(e) => setWithdrawPhone(e.target.value)}
                            margin="normal"
                            placeholder="e.g., 58881234"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenWithdraw(false)}>Cancel</Button>
                    <Button onClick={handleWithdraw} variant="contained" color="primary">
                        Withdraw
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default OwnerDashboard;