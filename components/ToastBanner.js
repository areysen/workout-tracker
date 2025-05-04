import { useToast } from "@/components/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastBanner() {
  const {
    message,
    visible,
    toastType,
    hideToast,
    showUndo,
    onUndo,
    showToast,
  } = useToast();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 ${
            toastType === "success" ? "bg-green-600" : "bg-pink-500"
          } text-white text-center py-3 px-6 z-50 shadow-md`}
        >
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <span>{message}</span>
            {showUndo && onUndo && (
              <button
                onClick={() => {
                  onUndo();
                  hideToast();
                  showToast("Workout restored! 🎉", "success");
                }}
                className="ml-4 underline hover:text-yellow-200 text-sm"
              >
                Undo
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
