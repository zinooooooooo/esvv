import React from 'react';
import ToastNotification from './ToastNotification';

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-h-screen overflow-hidden">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 4}px)`,
            zIndex: 9999 - index,
          }}
        >
          <ToastNotification
            isVisible={true}
            onClose={() => onRemove(toast.id)}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
