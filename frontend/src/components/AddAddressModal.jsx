// ─── AddAddressModal.jsx ─────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Modal from './Modal';

const AddAddressModal = ({ show, onClose, onContinue, dark, theme, initialData = null }) => {
  const { text, muted, inp, D } = theme;
  const isEditing = initialData !== null;

  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  // Re-populate fields whenever the modal opens
  useEffect(() => {
    setLabel(initialData?.label ?? '');
    setAddress(initialData?.address ?? '');
    setSetAsDefault(initialData?.isDefault ?? false);
  }, [show]);

  const isComplete = label.trim() && address.trim();

  const handleContinue = () => {
    if (isComplete) {
      onContinue({ label, address, isDefault: setAsDefault });
      setLabel('');
      setAddress('');
      setSetAsDefault(false);
    }
  };

  const handleClose = () => {
    setLabel('');
    setAddress('');
    setSetAsDefault(false);
    onClose();
  };

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title={isEditing ? 'Edit Delivery Address' : 'Add Delivery Address'}
      dark={dark}
      maxWidth="max-w-lg"
    >
      <div className="p-6 space-y-5">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
            Address Label
          </label>
          <input
            type="text"
            placeholder="e.g., Home, Office, Vacation"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
          />
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
            Full Address
          </label>
          <textarea
            placeholder="Enter your complete delivery address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors resize-none ${inp}`}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={setAsDefault}
            onChange={(e) => setSetAsDefault(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className={`text-sm font-medium ${text}`}>Set as default delivery address</span>
        </label>

        <div className={`pt-2 border-t ${D ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
                D ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!isComplete}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                isComplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : D
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isEditing ? 'Review Changes' : 'Review Address'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddAddressModal;