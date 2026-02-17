import * as React from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

// Toast Context
const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
    
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300);
  };

  const isSuccess = toast.type === "success";
  
  return (
    <div
      className={`
        pointer-events-auto
        flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg
        min-w-[320px] max-w-md
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'translate-x-[400px] opacity-0' 
          : 'translate-x-0 opacity-100'
        }
        ${isSuccess 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
        }
      `}
      style={{
        animation: isExiting ? 'none' : 'slideIn 0.3s ease-out'
      }}
    >
      <div className={`flex-shrink-0 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      
      <div className="flex-1 pt-0.5">
        <p className={`text-sm font-medium ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        <p className={`text-sm mt-0.5 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {toast.message}
        </p>
      </div>
      
      <button
        onClick={handleRemove}
        className={`
          flex-shrink-0 p-1 rounded-md transition-colors
          ${isSuccess 
            ? 'text-green-600 hover:bg-green-100' 
            : 'text-red-600 hover:bg-red-100'
          }
        `}
      >
        <X className="w-4 h-4" />
      </button>
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}