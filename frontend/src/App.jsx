import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Toast from './components/Toast';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Dashboard />
      <Toast />
    </AuthProvider>
  );
}

export default App;
