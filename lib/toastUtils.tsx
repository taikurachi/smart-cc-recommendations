import toast from "react-hot-toast";
import { X } from "lucide-react";

interface ToastOptions {
  id?: string;
  duration?: number;
  style?: React.CSSProperties;
}

// Custom toast with close button
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(
      (t) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 hover:bg-gray-100 rounded p-1 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      ),
      {
        ...options,
        style: { maxWidth: '500px', ...options?.style },
      }
    );
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(
      (t) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 hover:bg-gray-100 rounded p-1 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      ),
      {
        ...options,
        style: { maxWidth: '500px', ...options?.style },
      }
    );
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(
      (t) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 hover:bg-gray-100 rounded p-1 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      ),
      {
        ...options,
        style: { maxWidth: '500px', ...options?.style },
      }
    );
  },

  info: (message: string, options?: ToastOptions) => {
    return toast(
      (t) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 hover:bg-gray-100 rounded p-1 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      ),
      {
        ...options,
        icon: 'ℹ️',
        style: { maxWidth: '500px', ...options?.style },
      }
    );
  },
};

