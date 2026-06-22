// ConfirmDialog.jsx
import Modal from "./Modal";
import { AlertCircle } from "lucide-react";
import Icon, { IC } from "./MyIcons";

export default function ConfirmDialog({
  isOpen, show, onClose, onConfirm, onBack,
  title = "Confirm Action",
  message, bannerMessage, previewData,
  confirmText = "Confirm", cancelText,
  isDangerous = false,
  dark = false, theme,
}) {
  const isVisible = isOpen ?? show ?? false;
  const D = dark;
  const muted = theme?.muted ?? (D ? "text-slate-400" : "text-slate-500");
  const text = theme?.text ?? (D ? "text-slate-100" : "text-slate-800");

  const resolvedCancelText = cancelText ?? (onBack ? "Go Back" : "Cancel");
  const handleCancel = onBack ?? onClose;

  return (
    <Modal show={isVisible} onClose={onClose} title={title} dark={dark} maxWidth="max-w-sm">
      <div className="p-6 space-y-5">

        {/* Blue info banner — used by FrequencyConfirmModal */}
        {bannerMessage && (
          <div className={`flex gap-3 p-4 rounded-xl border ${D ? "bg-blue-900/20 border-blue-800/60" : "bg-blue-50 border-blue-100"
            }`}>
            <p className={`text-sm leading-relaxed ${D ? "text-blue-300" : "text-blue-800"}`}>
              {bannerMessage}
            </p>
          </div>
        )}

        {/* Plain message with optional danger icon */}
        {message && (
          <div className="flex gap-3">
            {isDangerous && (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${muted}`}>{message}</p>
          </div>
        )}

        {/* Structured preview */}
        {previewData && previewData.length > 0 && (
          <div className={`rounded-xl border p-4 space-y-3 ${D ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
            }`}>
            {previewData.map(({ label, value, mono, extra }) => (
              <div key={label}>
                <div className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>
                  {label}
                </div>
                {value && (
                  <div className={`text-sm mt-1 ${mono ? "font-mono" : "font-bold"} ${text}`}>
                    {value}
                  </div>
                )}
                {extra && (
                  <div className={`flex items-center gap-2 pt-1 ${D ? "text-blue-300" : "text-blue-700"}`}>
                    <span className="text-xs font-bold">{extra}</span>
                    <Icon path={IC.check} className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${D
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors text-white shadow-md ${isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </Modal>
  );
}