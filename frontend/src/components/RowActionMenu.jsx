// RowActionMenu.jsx
import { useRef, useEffect, useState } from 'react';
import Icon, { IC } from './MyIcons';

export default function RowActionMenu({ onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && buttonRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Actions"
      >
        <Icon path={IC.more} className="w-4 h-4 text-slate-600" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10"
        >
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors first:rounded-t-lg"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors last:rounded-b-lg border-t border-slate-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
