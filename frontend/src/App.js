import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Library from './pages/Library';
import Collections from './pages/Collections';
import CollectionDetails from './pages/CollectionDetails';
import { CollectionProvider } from './contexts/CollectionContext';
import theme from './theme/theme';
import useResizeAnimationStopper from './hooks/useResizeAnimationStopper';

function App() {
  // Optimize animations during window resize
  useResizeAnimationStopper();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CollectionProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Library />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:id" element={<CollectionDetails />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </CollectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
