// src/components/Passenger/QRScanner.js
import React, { useState } from 'react';
import { Box, Button, Typography, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';

function PassengerQRScanner({ onScanSuccess, onClose }) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);

    const startScanner = () => {
        setError(null);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Your browser does not support camera access');
            return;
        }

        setScanning(true);
        alert('Camera scanner would open here.\nFor demo, click "Simulate Scan"');
    };

    const simulateScan = () => {
        const testDriverData = JSON.stringify({
            type: 'driver_payment',
            taxi_number: 'TAXI001',
            driver_id: 1,
            route: 'MASERU-KHUBETSOANA'
        });
        
        if (onScanSuccess) {
            onScanSuccess(testDriverData);
        }
        if (onClose) {
            onClose();
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Scan Driver's QR Code
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                    Position the driver's QR code within the frame
                </Typography>
                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                        📷 Camera scanner ready
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        For demo, use the simulate button
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={simulateScan} variant="contained" color="primary">
                    Simulate Scan
                </Button>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export default PassengerQRScanner;