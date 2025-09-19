import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { 
  CameraAlt,
  Close as CloseIcon,
  FlipCameraIos as FlipCameraIcon,
} from '@mui/icons-material';

const MobileBarcodeScanner = ({ onScan, onError, autoStart = true }) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentCamera, setCurrentCamera] = useState(0);
  const [availableCameras, setAvailableCameras] = useState([]);
  const codeReaderRef = useRef(null);
  const lastScannedRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    if (autoStart) {
      startScanning();
    }
    
    return () => {
      stopScanning();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [autoStart]);

  const startScanning = async (cameraIndex = 0) => {
    try {
      setError(null);
      setLoading(true);
      
      // Stop any existing scanning
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found on device');
      }

      setAvailableCameras(videoInputDevices);
      
      // Select camera (prefer back camera on mobile)
      let selectedDeviceId;
      if (cameraIndex < videoInputDevices.length) {
        selectedDeviceId = videoInputDevices[cameraIndex].deviceId;
      } else {
        // Try to find back camera
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
      }

      // Configure constraints for better mobile performance
      const constraints = {
        video: {
          deviceId: selectedDeviceId,
          facingMode: cameraIndex === 0 ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };

      // Start decoding from video device
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            
            // Prevent duplicate scans
            if (lastScannedRef.current === text) {
              return;
            }
            
            console.log('Scanned:', text);
            
            // Check if it's a valid ISBN (10 or 13 digits)
            const cleanISBN = text.replace(/[-\s]/g, '');
            if (cleanISBN.length === 10 || cleanISBN.length === 13) {
              lastScannedRef.current = text;
              
              // Vibrate on successful scan (if supported)
              if ('vibrate' in navigator) {
                navigator.vibrate(200);
              }
              
              onScan(cleanISBN);
              
              // Reset duplicate prevention after 3 seconds
              scanTimeoutRef.current = setTimeout(() => {
                lastScannedRef.current = null;
              }, 3000);
            } else {
              setError('Invalid barcode format. Please scan an ISBN barcode.');
            }
          }
          
          if (err && !(err.name === 'NotFoundException')) {
            console.error('Scanning error:', err);
          }
        }
      );

      setIsScanning(true);
      setLoading(false);
      setCurrentCamera(cameraIndex);
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

  const switchCamera = () => {
    if (availableCameras.length > 1) {
      const nextCamera = (currentCamera + 1) % availableCameras.length;
      stopScanning();
      startScanning(nextCamera);
    }
  };

  return (
    <Paper elevation={0} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          backgroundColor: 'black',
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: 'auto',
            minHeight: '300px',
            display: isScanning ? 'block' : 'none',
          }}
          playsInline
          muted
        />
        
        {/* Scanning overlay */}
        {isScanning && (
          <>
            {/* Scanning frame */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                maxWidth: '300px',
                aspectRatio: '3/1',
                border: '3px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: 'error.main',
                  animation: 'scan 2s linear infinite',
                },
                '@keyframes scan': {
                  '0%': { transform: 'translateY(-20px)' },
                  '50%': { transform: 'translateY(20px)' },
                  '100%': { transform: 'translateY(-20px)' },
                },
              }}
            />
            
            {/* Instructions */}
            <Typography
              sx={{
                position: 'absolute',
                bottom: 20,
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                fontSize: '0.9rem',
              }}
            >
              Position ISBN barcode in frame
            </Typography>

            {/* Camera switch button */}
            {availableCameras.length > 1 && (
              <IconButton
                onClick={switchCamera}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                  },
                }}
              >
                <FlipCameraIcon />
              </IconButton>
            )}
          </>
        )}
        
        {/* Loading state */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              backgroundColor: 'grey.900',
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
            <Typography sx={{ mt: 2, color: 'white' }}>
              Initializing camera...
            </Typography>
          </Box>
        )}

        {/* Not scanning state */}
        {!isScanning && !loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              backgroundColor: 'grey.100',
            }}
          >
            <CameraAlt sx={{ fontSize: 60, color: 'text.secondary' }} />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Camera not active
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MobileBarcodeScanner;
