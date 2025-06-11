import { useState } from "react";
import { Trash2 } from "lucide-react";


export default function ClearHistory({ handleClearAllHistory }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmClear = () => {
    handleClearAllHistory();
    setShowConfirm(false);
  };

  return (
    <div className=" inline-block">
      <button
        onClick={() => setShowConfirm(true)}
        className="text-sm font-medium text-red-600 hover:underline flex items-center gap-2"
      >
        Clear All History <Trash2 size={16} className="text-red-600" />
      </button>

      {showConfirm && (
        <div className=" right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 text-sm">
          <p className="mb-3">Are you sure you want to clear all history?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 text-gray-700 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmClear}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Yes, Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
