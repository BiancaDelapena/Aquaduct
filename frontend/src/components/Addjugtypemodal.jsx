// AddJugTypeModal.jsx
import { useState } from "react";
import Modal from "./Modal";

export default function AddJugTypeModal({ isOpen, onClose, onSave, dark, theme }) {
  const [form, setForm] = useState({
    typeName: "",
    capacity: "",
    purchasePrice: "",
    refillPrice: "",
    description: "",
    image: null,
    isAvailable: true,
  });

  const { muted, inp, D } = theme ?? {
    muted: "text-slate-500",
    inp: "border-slate-300 bg-white text-slate-800 focus:border-blue-500",
    D: false,
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = () => {
    if (isComplete) {
      onSave(form);
      setForm({
        typeName: "",
        capacity: "",
        purchasePrice: "",
        refillPrice: "",
        description: "",
        image: null,
        isAvailable: true,
      });
    }
  };

  const isComplete = form.typeName.trim() && form.capacity && form.purchasePrice && form.refillPrice;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`;
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`;

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      title="Add Jug Type"
      dark={dark}
      maxWidth="max-w-lg"
    >
      <div className="p-6 space-y-5">

        {/* Type Name */}
        <div>
          <label className={labelClass}>Type Name</label>
          <input
            name="typeName"
            type="text"
            placeholder="e.g. Blue Jug"
            value={form.typeName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Capacity */}
        <div>
          <label className={labelClass}>Gallon Capacity</label>
          <input
            name="capacity"
            type="number"
            placeholder="e.g. 5"
            value={form.capacity}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Purchase Price */}
        <div>
          <label className={labelClass}>Purchase Price</label>
          <div className={`flex items-center rounded-xl border px-4 transition-colors ${inp}`}>
            <span className={`text-sm font-medium mr-1 ${muted}`}>₱</span>
            <input
              name="purchasePrice"
              type="number"
              placeholder="0"
              value={form.purchasePrice}
              onChange={handleChange}
              className="w-full py-2.5 text-sm font-medium outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Refill Price */}
        <div>
          <label className={labelClass}>Refill Price</label>
          <div className={`flex items-center rounded-xl border px-4 transition-colors ${inp}`}>
            <span className={`text-sm font-medium mr-1 ${muted}`}>₱</span>
            <input
              name="refillPrice"
              type="number"
              placeholder="0"
              value={form.refillPrice}
              onChange={handleChange}
              className="w-full py-2.5 text-sm font-medium outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Optional notes..."
            value={form.description}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className={labelClass}>Image</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
          />
          {form.image && (
            <p className={`text-xs mt-1 ${muted}`}>Selected: {form.image.name}</p>
          )}
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between">
          <label className={labelClass}>Available</label>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              form.isAvailable ? "bg-blue-600" : D ? "bg-slate-700" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                form.isAvailable ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
              D
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
              isComplete
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                : D
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Save Jug Type
          </button>
        </div>

      </div>
    </Modal>
  );
}