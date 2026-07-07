import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// Event emitter helper for Toast
export const showToast = (message, type = "info") => {
  const event = new CustomEvent("show_toast", { detail: { message, type } });
  window.dispatchEvent(event);
};

// Register globally so any script/component can call window.showToast
window.showToast = showToast;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener("show_toast", handleToast);
    return () => window.removeEventListener("show_toast", handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none no-print">
      {toasts.map((toast) => {
        let bgColor = "bg-white border-slate-200 text-slate-800 shadow-slate-200/50";
        let Icon = Info;
        let iconColor = "text-blue-500";

        if (toast.type === "success") {
          bgColor = "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/50";
          Icon = CheckCircle2;
          iconColor = "text-emerald-600";
        } else if (toast.type === "error") {
          bgColor = "bg-red-50 border-red-200 text-red-950 shadow-red-100/50";
          Icon = XCircle;
          iconColor = "text-red-600";
        } else if (toast.type === "warning") {
          bgColor = "bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/50";
          Icon = AlertTriangle;
          iconColor = "text-amber-600";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-2xl p-4 flex items-start gap-3 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${bgColor}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 text-xs font-bold leading-relaxed whitespace-pre-line">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-100/50 flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
