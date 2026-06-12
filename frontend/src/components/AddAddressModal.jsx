// ─── AddAddressModal.jsx ─────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Modal from './Modal';

const Field = ({ label, value, onChange, placeholder, required = false, muted, inp }) => (
  <div>
    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
    />
  </div>
);

const AddAddressModal = ({ show, onClose, onContinue, dark, theme, initialData = null }) => {
  const { text, muted, inp, D } = theme;
  const isEditing = initialData !== null;

  const [addressType, setAddressType] = useState('House');
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (show) {
      setAddressType(initialData?.address_type ?? 'House');
      setStreetAddress(initialData?.street_address ?? '');
      setBarangay(initialData?.barangay ?? '');
      setBuildingName(initialData?.building_name ?? '');
      setUnitNumber(initialData?.unit_number ?? '');
      setIsDefault(initialData?.is_default ?? false);
    }
  }, [show, initialData]);

  const isApartment = addressType === 'Apartment';
  const isComplete = streetAddress.trim() && (!isApartment || unitNumber.trim());

  const handleContinue = () => {
    if (!isComplete) return;
    onContinue({
      address_type: addressType,
      street_address: streetAddress,
      barangay,
      building_name: buildingName,
      unit_number: unitNumber,
      is_default: isDefault,
    });
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Edit Delivery Address' : 'Add Delivery Address'}
      dark={dark}
      maxWidth="max-w-lg"
    >
      <div className="p-6 space-y-4">

        {/* Address Type Toggle */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
            Address Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['House', 'Apartment'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAddressType(type)}
                className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${addressType === type
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : D
                    ? 'border-slate-700 text-slate-300 hover:border-slate-500'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
              >
                {type === 'House' ? '🏠 House' : '🏢 Apartment'}
              </button>
            ))}
          </div>
        </div>

        {/* Apartment-only fields */}
        {isApartment && (
          <div className={`p-4 rounded-xl border space-y-4 ${D ? 'bg-slate-800/40 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
            <Field label="Unit Number" value={unitNumber} onChange={setUnitNumber}
              placeholder="e.g., 4B, 12A" required muted={muted} inp={inp} />
            <Field label="Building Name" value={buildingName} onChange={setBuildingName}
              placeholder="e.g., The Residences (optional)" muted={muted} inp={inp} />
          </div>
        )}

        <Field label="Street Address" value={streetAddress} onChange={setStreetAddress}
          placeholder="e.g., 123 Rizal Street" required muted={muted} inp={inp} />
        <Field label="Barangay" value={barangay} onChange={setBarangay}
          placeholder="e.g., Barangay San Antonio" muted={muted} inp={inp} />

        {/* Hardcoded city */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>City</label>
          <input
            type="text"
            value="Quezon City"
            readOnly
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-not-allowed opacity-60 ${inp}`}
          />
        </div>

        {/* Set as default */}
        <label className="flex items-center gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className={`text-sm font-medium ${text}`}>Set as default delivery address</span>
        </label>

        {/* Buttons */}
        <div className={`pt-2 border-t ${D ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${D ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!isComplete}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${isComplete
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