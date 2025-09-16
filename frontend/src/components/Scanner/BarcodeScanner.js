import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CameraAlt, Stop } from '@mui/icons-material';

const BarcodeScanner = ({ onScan, onError }) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found on device');
      }

      // Use the first available device (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start decoding from video device
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            // Successfully scanned
            const text = result.getText();
            console.log('Scanned:', text);
            
            // Check if it's a valid ISBN (10 or 13 digits)
            const cleanISBN = text.replace(/[-\s]/g, '');
            if (cleanISBN.length === 10 || cleanISBN.length === 13) {
              onScan(cleanISBN);
              stopScanning();
            } else {
              setError('Invalid barcode format. Please scan an ISBN barcode.');
            }
          }
          
          if (err && !(err.name === 'NotFoundException')) {
            console.error('Scanning error:', err);
            if (onError) {
              onError(err);
            }
          }
        }
      );

      setIsScanning(true);
      setLoading(false);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to access camera');
      setLoading(false);
      if (onError) {
        onError(err);
      }
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Barcode Scanner
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          mx: 'auto',
          mb: 2,
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: 'auto',
            border: '2px solid #ccc',
            borderRadius: 8,
            display: isScanning ? 'block' : 'none',
          }}
        />
        
        {!isScanning && !loading && (
          <Box
            sx={{
              width: '100%',
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 2,
              border: '2px dashed #ccc',
            }}
          >
            <Typography color="text.secondary">
              Camera preview will appear here
            </Typography>
          </Box>
        )}

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {!isScanning ? (
          <Button
            variant="contained"
            startIcon={<CameraAlt />}
            onClick={startScanning}
            disabled={loading}
            size="large"
          >
            Start Scanner
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Stop />}
            onClick={stopScanning}
            size="large"
          >
            Stop Scanner
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Position the ISBN barcode within the camera view
      </Typography>
    </Paper>
  );
};

export default BarcodeScanner;
