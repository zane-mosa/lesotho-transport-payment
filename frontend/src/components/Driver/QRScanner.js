// src/components/Driver/QRScanner.js
import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';

function QRScanner({ onScanSuccess, onScanError }) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // For testing without camera, simulate a scan
    const simulateScan = () => {
        const testQRData = JSON.stringify({
            transaction_id: 1,
            reference: 'TX1234567890',
            amount: 13,
            trip_type: 'local'
        });
        
        if (onScanSuccess) {
            onScanSuccess(testQRData);
        }
    };

    const startScanner = () => {
        setError(null);
        setLoading(true);
        
        // Check if browser supports camera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Your browser does not support camera access. Please use the manual test button below.');
            setLoading(false);
            return;
        }

        // For demo purposes, show a message about camera access
        setError(null);
        setIsScanning(true);
        setLoading(false);
        
        // Show instructions
        alert('Camera access required. Please allow camera permission when prompted.\n\nFor testing without camera, click "Simulate Scan" button.');
    };

    const stopScanner = () => {
        setIsScanning(false);
        setError(null);
    };

    return (
        <Box sx={{ textAlign: 'center', p: 2 }}>
            {error && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            
            {!isScanning ? (
                <Box>
                    <Button
                        variant="contained"
                        onClick={startScanner}
                        disabled={loading}
                        sx={{ mt: 2, py: 1.5, px: 4, mr: 2 }}
                        size="large"
                        startIcon={<QrCodeIcon />}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Start Camera Scanner'}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        onClick={simulateScan}
                        sx={{ mt: 2, py: 1.5, px: 4 }}
                        size="large"
                        color="secondary"
                    >
                        Simulate Scan (Test)
                    </Button>
                    
                    <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                        For testing: Use "Simulate Scan" to test without camera
                    </Typography>
                </Box>
            ) : (
                <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Camera scanner would open here. For testing, please use the "Simulate Scan" button.
                    </Alert>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        📷 Camera access requires HTTPS or localhost
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={simulateScan}
                        sx={{ mt: 2, mr: 2 }}
                        color="success"
                    >
                        Simulate QR Scan
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={stopScanner}
                        sx={{ mt: 2 }}
                        color="error"
                    >
                        Cancel
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default QRScanner;