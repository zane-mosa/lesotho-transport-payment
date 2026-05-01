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
    Tabs,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    const [openRegisterVehicle, setOpenRegisterVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        taxi_number: '',
        registration_number: '',
        route: '',
        capacity: 15,
        driver_id: ''
    });
    const [vehicleTransactions, setVehicleTransactions] = useState({});

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
            
            // Load transactions for each vehicle
            response.data.dashboard.vehicles.forEach(vehicle => {
                loadVehicleTransactions(vehicle.id, vehicle.taxi_number);
            });
            
            setLoading(false);
        } catch (error) {
            console.error('Dashboard error:', error);
            setMessage({ type: 'error', text: 'Failed to load dashboard' });
            setLoading(false);
        }
    };

    const loadVehicleTransactions = async (vehicleId, taxiNumber) => {
        try {
            const response = await axios.get(`${API_URL}/owner/vehicle-transactions/${vehicleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVehicleTransactions(prev => ({
                ...prev,
                [taxiNumber]: response.data.transactions
            }));
        } catch (error) {
            console.error('Failed to load vehicle transactions:', error);
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

    const assignDriver = async (vehicleId, driverId) => {
        if (!driverId) return;
        
        try {
            const response = await axios.put(`${API_URL}/owner/assign-driver`, {
                vehicle_id: vehicleId,
                driver_id: driverId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: response.data.message || 'Driver assigned successfully!' });
            loadDashboard();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Assignment failed' });
        }
    };

    const handleRegisterVehicle = async () => {
        if (!newVehicle.taxi_number) {
            setMessage({ type: 'error', text: 'Taxi number is required' });
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/owner/register-vehicle`, newVehicle, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Vehicle registered successfully!' });
            setOpenRegisterVehicle(false);
            setNewVehicle({
                taxi_number: '',
                registration_number: '',
                route: '',
                capacity: 15,
                driver_id: ''
            });
            loadDashboard();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Registration failed' });
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
            setMessage({ type: 'error', text: error.response?.data?.error?.message || error.response?.data?.error || 'Withdrawal failed' });
        }
    };

    const getVehicleStats = (taxiNumber) => {
        const transactions = vehicleTransactions[taxiNumber] || [];
        const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalTrips = transactions.length;
        return { totalEarnings, totalTrips };
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

                {/* Stats Cards - UPDATED to show Available Balance */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Available Balance Card - NEW */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AttachMoneyIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Available Balance
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            M {dashboard?.stats?.available_balance || 0}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Total: M {dashboard?.stats?.total_earnings || 0} | Withdrawn: M {dashboard?.stats?.total_withdrawn || 0}
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

                {/* Action Buttons */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenRegisterVehicle(true)}
                    >
                        Register New Taxi
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AccountBalanceWalletIcon />}
                        onClick={() => setOpenWithdraw(true)}
                        disabled={!dashboard?.stats?.available_balance || dashboard?.stats?.available_balance < 10}
                    >
                        Withdraw Earnings
                    </Button>
                </Box>

                {/* Tabs */}
                <Paper sx={{ mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="My Taxis" />
                        <Tab label="All Transactions" />
                    </Tabs>
                </Paper>

                {/* My Taxis Tab */}
                {tabValue === 0 && (
                    <Box>
                        {vehicles.map((vehicle) => {
                            const stats = getVehicleStats(vehicle.taxi_number);
                            return (
                                <Accordion key={vehicle.id} sx={{ mb: 2 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <DirectionsBusIcon sx={{ fontSize: 30, color: '#2E7D32' }} />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {vehicle.taxi_number}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {vehicle.route}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Driver: {vehicle.driver_name}
                                                </Typography>
                                                <Chip 
                                                    label={vehicle.status} 
                                                    color="success" 
                                                    size="small" 
                                                />
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {/* Vehicle Stats */}
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid item xs={12} md={6}>
                                                <Card sx={{ bgcolor: '#e8f5e9' }}>
                                                    <CardContent>
                                                        <Typography color="textSecondary" gutterBottom>
                                                            Total Earnings
                                                        </Typography>
                                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                            M {stats.totalEarnings}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Card>
                                                    <CardContent>
                                                        <Typography color="textSecondary" gutterBottom>
                                                            Total Trips
                                                        </Typography>
                                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                            {stats.totalTrips}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        </Grid>

                                        {/* Vehicle Info */}
                                        <Paper sx={{ p: 2, mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                🚕 Vehicle Information
                                            </Typography>
                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2" color="textSecondary">Taxi Number</Typography>
                                                    <Typography variant="body1" fontWeight="bold">{vehicle.taxi_number}</Typography>
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2" color="textSecondary">Route</Typography>
                                                    <Typography variant="body1">{vehicle.route}</Typography>
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2" color="textSecondary">Capacity</Typography>
                                                    <Typography variant="body1">{vehicle.capacity} passengers</Typography>
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <Typography variant="body2" color="textSecondary">Driver</Typography>
                                                    <Typography variant="body1">{vehicle.driver_name}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        {/* Assign Driver */}
                                        <FormControl sx={{ mt: 2, minWidth: 250, mb: 2 }}>
                                            <InputLabel>Assign/Change Driver</InputLabel>
                                            <Select
                                                value=""
                                                onChange={(e) => assignDriver(vehicle.id, e.target.value)}
                                                label="Assign/Change Driver"
                                            >
                                                <MenuItem value="">Select a driver</MenuItem>
                                                {drivers.filter(d => d.user_id !== vehicle.driver_id).map((driver) => (
                                                    <MenuItem key={driver.user_id} value={driver.user_id}>
                                                        {driver.name} - {driver.phone_number}
                                                    </MenuItem>
                                                ))}
                                                {vehicle.driver_id && (
                                                    <MenuItem value={vehicle.driver_id} disabled>
                                                        Current: {vehicle.driver_name}
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>

                                        {/* Vehicle Transactions */}
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                            📋 Recent Transactions
                                        </Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell><strong>Time</strong></TableCell>
                                                        <TableCell><strong>Amount</strong></TableCell>
                                                        <TableCell><strong>Passenger</strong></TableCell>
                                                        <TableCell><strong>Trip Type</strong></TableCell>
                                                        <TableCell><strong>Reference</strong></TableCell>
                                                        <TableCell><strong>Status</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(vehicleTransactions[vehicle.taxi_number] || []).slice(0, 10).map((tx) => (
                                                        <TableRow key={tx.id}>
                                                            <TableCell>{new Date(tx.time).toLocaleTimeString()}</TableCell>
                                                            <TableCell><strong>M {tx.amount}</strong></TableCell>
                                                            <TableCell>{tx.passenger_name || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={tx.trip_type === 'special' ? '🚗 SPECIAL' : '🚌 LOCAL'}
                                                                    size="small"
                                                                    color={tx.trip_type === 'special' ? 'secondary' : 'default'}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{tx.reference}</TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={tx.status} 
                                                                    color={tx.status === 'completed' ? 'success' : 'warning'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {(!vehicleTransactions[vehicle.taxi_number] || vehicleTransactions[vehicle.taxi_number].length === 0) && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} align="center">
                                                                No transactions yet
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                        {vehicles.length === 0 && (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body1" color="textSecondary">
                                    No vehicles registered yet. Click "Register New Taxi" to add your first vehicle.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                )}

                {/* All Transactions Tab */}
                {tabValue === 1 && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📋 All Transactions
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
                                        <TableCell><strong>Trip Type</strong></TableCell>
                                        <TableCell><strong>Reference</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dashboard?.recent_transactions?.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.time).toLocaleString()}</TableCell>
                                            <TableCell><strong>M {tx.amount}</strong></TableCell>
                                            <TableCell>{tx.passenger_name || 'N/A'}</TableCell>
                                            <TableCell>{tx.taxi_number}</TableCell>
                                            <TableCell>{tx.driver_name}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={tx.trip_type === 'special' ? '🚗 SPECIAL' : '🚌 LOCAL'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{tx.reference}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!dashboard?.recent_transactions || dashboard.recent_transactions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
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

            {/* Register Vehicle Dialog */}
            <Dialog open={openRegisterVehicle} onClose={() => setOpenRegisterVehicle(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    <AddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Register New Taxi
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Taxi Number"
                            value={newVehicle.taxi_number}
                            onChange={(e) => setNewVehicle({ ...newVehicle, taxi_number: e.target.value.toUpperCase() })}
                            margin="normal"
                            placeholder="e.g., TAXI008"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Registration Number"
                            value={newVehicle.registration_number}
                            onChange={(e) => setNewVehicle({ ...newVehicle, registration_number: e.target.value.toUpperCase() })}
                            margin="normal"
                            placeholder="e.g., ABC123"
                        />
                        <TextField
                            fullWidth
                            label="Route (e.g., Maseru - Roma)"
                            value={newVehicle.route}
                            onChange={(e) => setNewVehicle({ ...newVehicle, route: e.target.value })}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Capacity"
                            type="number"
                            value={newVehicle.capacity}
                            onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                            margin="normal"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Assign Driver (Optional)</InputLabel>
                            <Select
                                value={newVehicle.driver_id}
                                onChange={(e) => setNewVehicle({ ...newVehicle, driver_id: e.target.value })}
                                label="Assign Driver (Optional)"
                            >
                                <MenuItem value="">No driver assigned</MenuItem>
                                {drivers.map((driver) => (
                                    <MenuItem key={driver.user_id} value={driver.user_id}>
                                        {driver.name} - {driver.phone_number}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegisterVehicle(false)}>Cancel</Button>
                    <Button onClick={handleRegisterVehicle} variant="contained" color="primary">
                        Register
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Withdraw Dialog */}
            <Dialog open={openWithdraw} onClose={() => setOpenWithdraw(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Withdraw Earnings
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Available Balance: M {dashboard?.stats?.available_balance || 0}
                        </Typography>
                        <TextField
                            fullWidth
                            label="Amount (M)"
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            margin="normal"
                            placeholder="Enter amount to withdraw"
                            inputProps={{ min: 10, max: dashboard?.stats?.available_balance || 0 }}
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
                    <Button 
                        onClick={handleWithdraw} 
                        variant="contained" 
                        color="primary"
                        disabled={!withdrawAmount || withdrawAmount < 10 || withdrawAmount > (dashboard?.stats?.available_balance || 0)}
                    >
                        Withdraw
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default OwnerDashboard;