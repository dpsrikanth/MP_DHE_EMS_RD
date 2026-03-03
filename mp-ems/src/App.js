import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import AppRoutes from "./routes";
import SessionMonitor from "./components/SessionMonitor";

// Setup Global Fetch Interceptor
const originalFetch = window.fetch;
window.fetch = async function () {
  const response = await originalFetch.apply(this, arguments);

  const url = arguments[0];
  const isLoginRequest = typeof url === 'string' && url.includes('/login');
  const isChangePasswordRequest = typeof url === 'string' && url.includes('/change-password');

  let isUnauthorized = response.status === 401 && !isLoginRequest && !isChangePasswordRequest;

  if (response.status === 400) {
    // Clone to read the body without consuming the original response stream
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data.message && data.message.toLowerCase().includes('token invalid')) {
        isUnauthorized = true;
      }
    } catch (e) {
      // Not JSON or unreadable
    }
  }

  if (isUnauthorized) {
    // If unauthorized or token invalid, clear tokens and dispatch a custom event
    localStorage.removeItem('token');
    localStorage.removeItem('roleName');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('unauthorized'));
    
    // Halt the promise chain so local component catch blocks don't fire during redirect
    return new Promise(() => {});
  }
  
  return response;
};

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [navigate]);

  return(
    <SessionMonitor>
      <AppRoutes />
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="colored" 
      />
    </SessionMonitor>
  );
};

export default App;