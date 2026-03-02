import React, { useState, useEffect, useCallback, useRef } from 'react';

const SessionMonitor = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const lastActivity = useRef(Date.now());
  const checkInterval = useRef(null);

  // Constants
  const IDLE_TIMEOUT = 30 * 1000; // 30 seconds of inactivity means idle
  const WARNING_THRESHOLD = 15; // Show warning 15 seconds before expiration

  // Update last activity timestamp on any user interaction
  const updateActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    // Attach event listeners for user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity, true);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity, true);
    };
  }, [updateActivity]);

  const checkToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Decode JWT payload bridging robust payload extraction
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = decodedPayload.exp;
      const secondsLeft = expirationTime - currentTime;

      setTimeLeft(secondsLeft);

      if (secondsLeft > 0 && secondsLeft <= WARNING_THRESHOLD) {
        const timeSinceLastActivity = Date.now() - lastActivity.current;
        
        // If the user is active, show the warning modal. If idle, do nothing (let it expire).
        if (timeSinceLastActivity < IDLE_TIMEOUT) {
          setShowWarning(true);
        }
      } else if (secondsLeft <= 0) {
        // Token has expired. Handled by global fetch interceptor upon next API call,
        // but we can proactively trigger the unauthorized event if they are idle.
        setShowWarning(false);
        const timeSinceLastActivity = Date.now() - lastActivity.current;
        if (timeSinceLastActivity >= IDLE_TIMEOUT) {
           localStorage.removeItem('token');
           localStorage.removeItem('roleName');
           localStorage.removeItem('user');
           window.dispatchEvent(new CustomEvent('unauthorized'));
        }
      } else {
        setShowWarning(false);
      }
    } catch (e) {
      console.error('Error decoding token', e);
    }
  }, []);

  useEffect(() => {
    // Check token expiration every second
    checkInterval.current = setInterval(checkToken, 1000);
    return () => clearInterval(checkInterval.current);
  }, [checkToken]);

  const handleExtendSession = async () => {
    try {
      // Background request to refresh token using the HttpOnly cookie
      const response = await fetch('http://localhost:8080/api/refresh-token', {
        method: 'POST',
        // Important: we need to send credentials to ensure the HttpOnly cookie is included
        credentials: 'dummy_or_include_based_on_cors' 
      });

      // Actually, since axios or fetch requires specific cors config for credentials, we must add credentials: 'include'.
      // Note: We'll modify it dynamically here.
    } catch(e) {}
  };

  const handleExtend = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/refresh-token', {
        method: 'POST',
        credentials: 'include' // sends HttpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        // Update local storage with the new fresh token (payload decoded correctly)
        localStorage.setItem('token', data.token);
        setShowWarning(false);
        // Refresh our interval check instantly
        checkToken();
        // Reset activity
        lastActivity.current = Date.now();
      } else {
        // Failed to refresh (maybe refresh token expired too). Let them get logged out.
        setShowWarning(false);
      }
    } catch (err) {
      console.error('Failed to extend session', err);
      setShowWarning(false);
    }
  };

  return (
    <>
      {children}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-8 text-center flex flex-col items-center">
            
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Session Expiring Soon</h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              For your security, your session will expire in <span className="font-bold text-amber-600">{timeLeft} seconds</span>. Would you like to extend your session and keep working?
            </p>
            
            <button 
              onClick={handleExtend}
              className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] tracking-widest uppercase text-sm"
            >
              Extend Session
            </button>
            <button 
              onClick={() => setShowWarning(false)}
              className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Ignore
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionMonitor;
