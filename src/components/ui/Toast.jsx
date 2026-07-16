import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const CONFIG = {
  success: { icon: <FiCheckCircle size={18} className="text-[#FFB700]" />, bg: 'border-[#FFE29A] bg-[#FFF8E5]' },
  error:   { icon: <FiAlertCircle  size={18} className="text-red-600"   />, bg: 'border-red-200   bg-red-50'   },
  info:    { icon: <FiInfo         size={18} className="text-blue-600"  />, bg: 'border-blue-200  bg-blue-50'  },
  warning: { icon: <FiAlertCircle  size={18} className="text-amber-600" />, bg: 'border-amber-200 bg-amber-50' },
};

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const { icon, bg } = CONFIG[type] ?? CONFIG.info;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-[10px] border shadow-md min-w-[300px] max-w-[400px] ${bg}`}
      role="alert"
      aria-live="polite"
    >
      <span className="mt-0.5 flex-shrink-0" aria-hidden="true">{icon}</span>
      <p className="flex-1 text-[13px] font-medium text-[#1A1A1A] leading-snug">{message}</p>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-[#60717B] hover:text-[#1A1A1A] flex-shrink-0"
      >
        <FiX size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}