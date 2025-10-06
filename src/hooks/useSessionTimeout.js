import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing session timeout
 * @param {number} timeoutMinutes - Timeout duration in minutes (default: 10)
 * @param {number} warningMinutes - Warning time before logout in minutes (default: 2)
 * @param {function} onLogout - Callback function to execute on logout
 * @param {boolean} isActive - Whether the session timeout should be active
 * @returns {object} - Session timeout state and controls
 */
const useSessionTimeout = (timeoutMinutes = 10, warningMinutes = 2, onLogout, isActive = true) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // Calculate timeout and warning times in milliseconds
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;
  const warningThreshold = timeoutMs - warningMs;

  // Reset session timeout
  const resetTimeout = useCallback(() => {
    if (!isActive || isLoggedOut) return;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setTimeLeft(null);

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      if (isActive && !isLoggedOut) {
        setShowWarning(true);
        setTimeLeft(warningMs);
      }
    }, warningThreshold);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      if (isActive && !isLoggedOut) {
        handleLogout();
      }
    }, timeoutMs);
  }, [isActive, isLoggedOut, timeoutMs, warningMs, warningThreshold]);

  // Handle logout
  const handleLogout = useCallback(() => {
    setIsLoggedOut(true);
    setShowWarning(false);
    setTimeLeft(null);
    
    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Execute logout callback
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    }
  }, [onLogout]);

  // Extend session (reset timeout)
  const extendSession = useCallback(() => {
    if (!isActive || isLoggedOut) return;
    resetTimeout();
  }, [isActive, isLoggedOut, resetTimeout]);

  // Activity detection
  const handleActivity = useCallback(() => {
    if (!isActive || isLoggedOut) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if there's been significant activity (more than 1 second)
    if (timeSinceLastActivity > 1000) {
      resetTimeout();
    }
  }, [isActive, isLoggedOut, resetTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (!isActive || isLoggedOut) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isLoggedOut, handleActivity, resetTimeout]);

  // Update countdown timer
  useEffect(() => {
    if (!showWarning || isLoggedOut) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceWarning = now - (lastActivityRef.current + warningThreshold);
      const remaining = Math.max(0, warningMs - timeSinceWarning);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        handleLogout();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showWarning, isLoggedOut, warningMs, warningThreshold, handleLogout]);

  // Format time for display
  const formatTime = useCallback((milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  }, []);

  return {
    timeLeft,
    showWarning,
    isLoggedOut,
    extendSession,
    formatTime: timeLeft ? formatTime(timeLeft) : null,
    resetTimeout
  };
};

export default useSessionTimeout;
