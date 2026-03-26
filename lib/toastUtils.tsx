import toast from "react-hot-toast";
import { X } from "lucide-react";

interface ToastOptions {
  id?: string;
  duration?: number;
  style?: React.CSSProperties;
}

const TOAST_MAX_WIDTH = "500px";

function ToastContent({
  message,
  toastId,
}: {
  message: string;
  toastId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 w-full">
      <span className="flex-1">{message}</span>
      <button
        onClick={() => toast.dismiss(toastId)}
        className="flex-shrink-0 hover:bg-gray-100 rounded p-1 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={16} className="text-gray-500" />
      </button>
    </div>
  );
}

function mergeStyle(options?: ToastOptions) {
  return { maxWidth: TOAST_MAX_WIDTH, ...options?.style };
}

export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(
      (t) => <ToastContent message={message} toastId={t.id} />,
      { ...options, style: mergeStyle(options) },
    ),

  error: (message: string, options?: ToastOptions) =>
    toast.error(
      (t) => <ToastContent message={message} toastId={t.id} />,
      { ...options, style: mergeStyle(options) },
    ),

  loading: (message: string, options?: ToastOptions) =>
    toast.loading(
      (t) => <ToastContent message={message} toastId={t.id} />,
      { ...options, style: mergeStyle(options) },
    ),

  info: (message: string, options?: ToastOptions) =>
    toast(
      (t) => <ToastContent message={message} toastId={t.id} />,
      { ...options, icon: "ℹ️", style: mergeStyle(options) },
    ),
};
