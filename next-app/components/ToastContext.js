"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [onUndo, setOnUndo] = useState(null);
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    let timeout;
    if (visible) {
      timeout = setTimeout(() => {
        setVisible(false);
        setMessage("");
        setShowUndo(false);
        setOnUndo(null);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [visible, message]);

  const showToast = (msg, type = "success", options = {}) => {
    setToastType(type);
    setMessage(msg);
    setVisible(true);
    setShowUndo(options.showUndo || false);
    setOnUndo(() => options.onUndo || null); // preserve function reference
  };

  const hideToast = () => {
    setVisible(false);
    setMessage("");
  };

  return (
    <ToastContext.Provider
      value={{
        message,
        visible,
        toastType,
        showToast,
        hideToast,
        showUndo,
        onUndo,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
