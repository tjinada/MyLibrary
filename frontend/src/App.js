import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Library from './pages/Library';
import AddBook from './pages/AddBook';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import Collections from './pages/Collections';
import CollectionDetails from './pages/CollectionDetails';
import Dashboard from './pages/Dashboard';
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
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/library" replace />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/add" element={<AddBook />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/book/:isbn" element={<BookDetail />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/collections/:id" element={<CollectionDetails />} />
                </Route>
                <Route path="*" element={<Navigate to="/library" replace />} />
              </Route>
            </Routes>
          </Router>
        </CollectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
