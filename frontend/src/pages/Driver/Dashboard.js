// src/pages/Driver/Dashboard.js
import React, { useState, useEffect } from 'react';
import { driverService } from '../../services/api';
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
    Divider
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function DriverDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [assignedVehicle, setAssignedVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [balance, setBalance] = useState(0);
    const [confirmingId, setConfirmingId] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        loadAssignedVehicle();
        loadDashboard();
    }, []);

    const loadAssignedVehicle = async () => {
        try {
            const response = await axios.get(`${API_URL}/driver/assigned-vehicle`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignedVehicle(response.data.vehicle);
        } catch (error) {
            console.error('No assigned vehicle:', error.response?.data?.error);
            setMessage({ type: 'info', text: 'No vehicle assigned yet. Please contact your taxi owner.' });
        }
    };

    const loadDashboard = async () => {
        try {
            const response = await driverService.getDashboard();
            setDashboard(response.data.dashboard);
            const totalEarnings = response.data.dashboard.stats.weekly_earnings;
            setBalance(totalEarnings);
            setLoading(false);
        } catch (error) {
            console.error('Dashboard load error:', error);
            setLoading(false);
        }
    };

    const confirmPayment = async (transactionId) => {
        setConfirmingId(transactionId);
        try {
            await driverService.confirmPayment(transactionId);
            setMessage({ type: 'success', text: '✅ Payment confirmed successfully!' });
            loadDashboard();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to confirm payment' });
        }
        setConfirmingId(null);
    };

    const getDriverQRData = () => {
        if (!assignedVehicle) return '';
        return JSON.stringify({
            type: 'driver_payment',
            taxi_number: assignedVehicle.taxi_number,
            driver_id: assignedVehicle.id,
            route: assignedVehicle.route,
            timestamp: new Date().toISOString()
        });
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
                    🚖 Driver Dashboard
                </Typography>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AttachMoneyIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Today's Earnings
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            M {dashboard?.stats?.today_earnings || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <DirectionsBusIcon sx={{ fontSize: 40, color: '#FFA000' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Today's Trips
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {dashboard?.stats?.today_trips || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TrendingUpIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Weekly Earnings
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            M {dashboard?.stats?.weekly_earnings || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Assigned Vehicle Info - instead of registration form */}
                {assignedVehicle ? (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            🚕 Your Assigned Vehicle
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="textSecondary">Taxi Number</Typography>
                                <Typography variant="body1" fontWeight="bold">{assignedVehicle.taxi_number}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="textSecondary">Route</Typography>
                                <Typography variant="body1">{assignedVehicle.route}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="textSecondary">Capacity</Typography>
                                <Typography variant="body1">{assignedVehicle.capacity} passengers</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="textSecondary">Owner</Typography>
                                <Typography variant="body1">{assignedVehicle.owner_name || 'Taxi Owner'}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        No vehicle assigned yet. Please contact your taxi owner.
                    </Alert>
                )}

                {/* Driver QR Code for Passengers to Scan - Only show if assigned vehicle exists */}
                {assignedVehicle && (
                    <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                            📱 Passenger Scan to Pay
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Passengers can scan this QR code to pay for their trip
                        </Typography>
                        <Box sx={{ mt: 2, display: 'inline-block', bgcolor: 'white', p: 2, borderRadius: 2 }}>
                            <QRCodeSVG 
                                value={getDriverQRData()} 
                                size={180} 
                            />
                        </Box>
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold' }}>
                            Taxi: {assignedVehicle.taxi_number} | Route: {assignedVehicle.route}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                            Passenger: Scan this QR code to pay for your trip
                        </Typography>
                    </Paper>
                )}

                {/* Recent Transactions with Confirm Button */}
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
                                    <TableCell><strong>Trip Type</strong></TableCell>
                                    <TableCell><strong>Reference</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Action</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dashboard?.recent_transactions?.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            {new Date(tx.time).toLocaleTimeString()}
                                        </TableCell>
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
                                        <TableCell>
                                            {tx.status === 'pending' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    startIcon={<CheckCircleIcon />}
                                                    onClick={() => confirmPayment(tx.id)}
                                                    disabled={confirmingId === tx.id}
                                                >
                                                    {confirmingId === tx.id ? <CircularProgress size={20} /> : 'Confirm'}
                                                </Button>
                                            )}
                                            {tx.status === 'completed' && (
                                                <Chip label="Confirmed" color="success" size="small" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!dashboard?.recent_transactions || dashboard.recent_transactions.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No transactions yet</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </Container>
    );
}

export default DriverDashboard;