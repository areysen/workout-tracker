import React from "react";

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-pink-500 to-pink-700 p-6 rounded-lg shadow-lg max-w-sm w-full text-center border border-pink-400">
        <h2 className="text-white text-2xl font-extrabold mb-4">{message}</h2>
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-white text-white font-bold hover:bg-white hover:text-[#242B2F] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
