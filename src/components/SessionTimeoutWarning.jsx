import { useState, useEffect } from 'react';
import { IoTime, IoClose, IoRefresh } from 'react-icons/io5';

const SessionTimeoutWarning = ({ 
  isVisible, 
  timeLeft, 
  onExtendSession, 
  onClose, 
  onLogout 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleExtendSession = () => {
    onExtendSession();
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[10002] flex items-center justify-center p-4 transition-all duration-300 ${
      isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 transform transition-all duration-300 ${
        isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <IoTime className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Session Timeout Warning</h3>
                <p className="text-sm text-gray-600">Your session will expire soon</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              You've been inactive for a while. Your session will expire in{' '}
              <span className="font-semibold text-orange-600">{timeLeft}</span>.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>What happens next?</strong><br />
                If you don't take action, you'll be automatically logged out and will need to sign in again.
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Time remaining</span>
              <span>{timeLeft}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ 
                  width: timeLeft ? `${(parseInt(timeLeft.split(':')[0]) * 60 + parseInt(timeLeft.split(':')[1])) / 120 * 100}%` : '0%' 
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleExtendSession}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <IoRefresh className="w-4 h-4" />
              <span>Stay Logged In</span>
            </button>
            
            <button
              onClick={onLogout}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Logout Now
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This warning appears when you've been inactive for 8+ minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
