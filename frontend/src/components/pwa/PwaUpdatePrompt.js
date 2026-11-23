import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Registers the service worker (production only) and resolves to the
// registration that has a new version waiting, or null.
const useServiceWorkerUpdate = () => {
  const [waitingRegistration, setWaitingRegistration] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    let cancelled = false;
    let registration = null;
    let intervalId = null;

    const checkForUpdate = () => {
      if (registration) registration.update().catch(() => {});
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };

    const notifyIfWaiting = () => {
      // A controller means this is an update, not the first install.
      if (!cancelled && registration.waiting && navigator.serviceWorker.controller) {
        setWaitingRegistration(registration);
      }
    };

    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .then((reg) => {
        if (cancelled) return;
        registration = reg;

        notifyIfWaiting();
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') notifyIfWaiting();
          });
        });

        // Same cadence as TJ Books: now, every 5 minutes, and whenever the app comes back.
        checkForUpdate();
        intervalId = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', checkForUpdate);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', checkForUpdate);
    };
  }, []);

  return waitingRegistration;
};

const PwaUpdatePrompt = () => {
  const waitingRegistration = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!waitingRegistration || dismissed) return null;

  const handleUpdate = () => {
    if (!waitingRegistration.waiting) {
      window.location.reload();
      return;
    }
    setUpdating(true);
    // Reload once the new worker has taken control.
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    waitingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const handleDismiss = () => setDismissed(true);

  return (
    <Paper
      role="alert"
      elevation={0}
      sx={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top))',
        left: { xs: 16, sm: 'auto' },
        right: 16,
        width: { sm: 320 },
        zIndex: (theme) => theme.zIndex.snackbar + 1,
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        borderRadius: '16px',
        border: 0,
        bgcolor: 'primary.dark',
        color: 'common.white',
        boxShadow: '0 10px 30px rgba(14, 165, 233, 0.3)',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RefreshIcon fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Update available
        </Typography>
        <Typography variant="caption" component="p" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 1.5 }}>
          A new version of the library is ready.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleUpdate}
            disabled={updating}
            sx={{
              flex: 1,
              minHeight: 44,
              bgcolor: 'common.white',
              color: 'primary.dark',
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
              '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.7)', color: 'primary.dark' },
            }}
          >
            {updating ? 'Updating…' : 'Update now'}
          </Button>
          <Button
            onClick={handleDismiss}
            sx={{
              minHeight: 44,
              px: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'common.white',
              fontWeight: 600,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
            }}
          >
            Later
          </Button>
        </Box>
      </Box>
      <IconButton
        aria-label="Dismiss update notification"
        onClick={handleDismiss}
        size="small"
        sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: -0.5, mr: -0.5 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default PwaUpdatePrompt;
