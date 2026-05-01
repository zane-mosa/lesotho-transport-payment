// src/pages/Passenger/Dashboard.js
import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/api';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel,
    Card,
    CardContent,
    Grid,
    InputAdornment
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

function PassengerDashboard() {
    const [tripType, setTripType] = useState('local');
    const [localTrips, setLocalTrips] = useState(1);
    const [specialAmount, setSpecialAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [message, setMessage] = useState(null);
    const [balance, setBalance] = useState(0);
    const [taxiNumber, setTaxiNumber] = useState('');
    const [taxiValid, setTaxiValid] = useState(null);
    const [checkingTaxi, setCheckingTaxi] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);

    // Fare constants
    const LOCAL_FARE_PER_TRIP = 13;
    const SPECIAL_MIN_FARE = 100;

    useEffect(() => {
        loadHistory();
        loadBalance();
    }, []);

    const loadHistory = async () => {
        try {
            const response = await paymentService.getHistory();
            setTransactions(response.data.transactions || []);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const loadBalance = async () => {
        try {
            const response = await paymentService.getHistory();
            const totalSpent = (response.data.transactions || [])
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            setBalance(totalSpent);
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };

    // Updated checkTaxiNumber function - sends taxi number in uppercase
    const checkTaxiNumber = async () => {
        if (!taxiNumber.trim()) {
            setTaxiValid(null);
            setSelectedDriver(null);
            return;
        }
        
        setCheckingTaxi(true);
        try {
            const upperTaxiNumber = taxiNumber.toUpperCase();
            const response = await fetch(`http://localhost:3000/api/driver/check-taxi/${upperTaxiNumber}`);
            const data = await response.json();
            console.log('Check taxi response:', data);
            
            if (data.valid) {
                setTaxiValid(true);
                setSelectedDriver(data.driver);
                setMessage({ type: 'success', text: `✅ Taxi ${upperTaxiNumber} found! Paying to ${data.driver.name}` });
            } else {
                setTaxiValid(false);
                setSelectedDriver(null);
                setMessage({ type: 'error', text: `❌ Taxi number ${upperTaxiNumber} not found. Please check and try again.` });
            }
        } catch (error) {
            console.error('Check taxi error:', error);
            setTaxiValid(false);
            setSelectedDriver(null);
            setMessage({ type: 'error', text: 'Error checking taxi number' });
        }
        setCheckingTaxi(false);
    };

    const getTotalAmount = () => {
        if (tripType === 'local') {
            return LOCAL_FARE_PER_TRIP * localTrips;
        } else {
            return parseFloat(specialAmount) || 0;
        }
    };

    const validateAmount = () => {
        const amount = getTotalAmount();
        
        if (!taxiNumber.trim()) {
            setMessage({ type: 'error', text: 'Please enter taxi number' });
            return false;
        }
        if (!taxiValid) {
            setMessage({ type: 'error', text: 'Please enter a valid taxi number' });
            return false;
        }
        if (tripType === 'local') {
            if (localTrips < 1) {
                setMessage({ type: 'error', text: 'Please select at least 1 trip' });
                return false;
            }
            return true;
        } else {
            if (!specialAmount || specialAmount < SPECIAL_MIN_FARE) {
                setMessage({ type: 'error', text: `Special trip minimum fare is M${SPECIAL_MIN_FARE}` });
                return false;
            }
            return true;
        }
    };

    const handlePayment = async () => {
        if (!validateAmount()) return;

        const amount = getTotalAmount();
        setLoading(true);
        
        try {
            const response = await paymentService.initiatePayment({
                amount: amount,
                payment_method: paymentMethod,
                trip_type: tripType,
                trip_details: tripType === 'local' ? `${localTrips} trip(s)` : 'special gate drop',
                taxi_number: taxiNumber.toUpperCase(),
                driver_id: selectedDriver?.driver_id
            });

            setQrCode(response.data.transaction.qr_code);
            
            const tripDescription = tripType === 'local' 
                ? `${localTrips} LOCAL trip(s) - Total M${amount}`
                : `SPECIAL trip (Gate Drop) - M${amount}`;
                
            setMessage({ 
                type: 'success', 
                text: `✅ Payment successful!\nTaxi: ${taxiNumber.toUpperCase()}\n${tripDescription}\nReference: ${response.data.transaction.reference}`
            });
            
            loadHistory();
            loadBalance();
            
            // Reset form
            setTaxiNumber('');
            setTaxiValid(null);
            setSelectedDriver(null);
            if (tripType === 'local') {
                setLocalTrips(1);
            } else {
                setSpecialAmount('');
            }
            setQrCode(null);
            
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Payment failed' 
            });
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const getTripTypeLabel = (type, details) => {
        if (type === 'special') return '🚗 SPECIAL';
        if (details && details.includes('trip')) return `🚌 LOCAL (${details})`;
        return '🚌 LOCAL';
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    🚍 Passenger Dashboard
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#2E7D32' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Spent
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            M {balance}
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
                                            Total Trips
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {transactions.filter(t => t.status === 'completed').length}
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
                                    <ConfirmationNumberIcon sx={{ fontSize: 40, color: '#FFA000' }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Active Payment
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {qrCode ? 'Pending' : 'None'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Pay Taxi Fare
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Taxi Number"
                            value={taxiNumber}
                            onChange={(e) => setTaxiNumber(e.target.value.toUpperCase())}
                            onBlur={checkTaxiNumber}
                            placeholder="e.g., TAXI003"
                            helperText={taxiValid === true ? "✓ Valid taxi" : taxiValid === false ? "✗ Taxi not found" : "Enter taxi number (e.g., TAXI003)"}
                            error={taxiValid === false}
                            color={taxiValid === true ? "success" : "primary"}
                            sx={{ width: 300 }}
                            InputProps={{
                                endAdornment: checkingTaxi && <CircularProgress size={20} />
                            }}
                        />
                        
                        {selectedDriver && (
                            <Alert severity="info" icon={<DirectionsBusIcon />}>
                                Paying to: <strong>{selectedDriver.name}</strong> - Taxi {selectedDriver.taxi_number}
                                <br />
                                <small>Route: {selectedDriver.route}</small>
                                {selectedDriver.owner_name && <small> | Owner: {selectedDriver.owner_name}</small>}
                            </Alert>
                        )}
                        
                        <FormControl component="fieldset">
                            <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Select Trip Type</FormLabel>
                            <RadioGroup
                                row
                                value={tripType}
                                onChange={(e) => setTripType(e.target.value)}
                                sx={{ mt: 1 }}
                            >
                                <FormControlLabel 
                                    value="local" 
                                    control={<Radio />} 
                                    label={
                                        <Box>
                                            <Typography sx={{ fontWeight: 'bold' }}>🚌 LOCAL</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                M{LOCAL_FARE_PER_TRIP} per trip - Drop at bus/taxi stop
                                            </Typography>
                                        </Box>
                                    } 
                                />
                                <FormControlLabel 
                                    value="special" 
                                    control={<Radio />} 
                                    label={
                                        <Box>
                                            <Typography sx={{ fontWeight: 'bold' }}>🚗 SPECIAL</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Minimum M{SPECIAL_MIN_FARE} - Drop at passenger's gate
                                            </Typography>
                                        </Box>
                                    } 
                                />
                            </RadioGroup>
                        </FormControl>

                        {tripType === 'local' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Number of Trips"
                                    type="number"
                                    value={localTrips}
                                    onChange={(e) => setLocalTrips(Math.max(1, parseInt(e.target.value) || 1))}
                                    sx={{ width: 150 }}
                                    InputProps={{ inputProps: { min: 1, step: 1 } }}
                                    helperText={`M${LOCAL_FARE_PER_TRIP} per trip`}
                                />
                                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', minWidth: 150 }}>
                                    <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                                        M {LOCAL_FARE_PER_TRIP * localTrips}
                                    </Typography>
                                    <Typography variant="caption">
                                        ({localTrips} trip{localTrips > 1 ? 's' : ''})
                                    </Typography>
                                </Paper>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <TextField
                                    label="Special Fare Amount (M)"
                                    type="number"
                                    value={specialAmount}
                                    onChange={(e) => setSpecialAmount(e.target.value)}
                                    sx={{ width: 200 }}
                                    InputProps={{
                                        inputProps: { min: SPECIAL_MIN_FARE },
                                        startAdornment: <InputAdornment position="start">M</InputAdornment>
                                    }}
                                    helperText={`Minimum M${SPECIAL_MIN_FARE}`}
                                />
                                {specialAmount >= SPECIAL_MIN_FARE && (
                                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                        <Typography variant="body2" color="textSecondary">Amount to pay:</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FFA000' }}>
                                            M {specialAmount}
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        )}
                        
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                label="Payment Method"
                            >
                                <MenuItem value="mpesa">📱 M-Pesa</MenuItem>
                                <MenuItem value="ecocash">📱 EcoCash</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Button
                            variant="contained"
                            onClick={handlePayment}
                            disabled={loading || !taxiValid}
                            sx={{ width: 200, py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} /> : `Pay M${getTotalAmount()}`}
                        </Button>
                    </Box>

                    {qrCode && (
                        <Box sx={{ mt: 4, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                                ✅ Payment Successful!
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                Taxi {taxiNumber} has been notified
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Reference: {qrCode.substring(0, 30)}...
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        📜 Transaction History
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell><strong>Reference</strong></TableCell>
                                    <TableCell><strong>Taxi</strong></TableCell>
                                    <TableCell><strong>Amount</strong></TableCell>
                                    <TableCell><strong>Trip Type</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.reference}</TableCell>
                                        <TableCell>{tx.taxi_number || 'N/A'}</TableCell>
                                        <TableCell><strong>M {tx.amount}</strong></TableCell>
                                        <TableCell>{getTripTypeLabel(tx.trip_type, tx.trip_details)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={tx.status} 
                                                color={getStatusColor(tx.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tx.date).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="textSecondary">No transactions yet. Make your first payment!</Typography>
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

export default PassengerDashboard;