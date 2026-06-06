// ─── Modal.jsx ────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import Icon, { IC } from './Icon.jsx';

const Modal = ({ show, onClose, title, dark, children, maxWidth = 'max-w-lg' }) => {
    // Close on Escape key
    useEffect(() => {
        const fn = (e) => { if (e.key === 'Escape') onClose(); };
        if (show) document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className={`
          ${maxWidth} w-full rounded-2xl shadow-2xl overflow-hidden
          max-h-[92vh] flex flex-col border
          ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
        `}
                style={{ animation: 'modalPop 0.18s cubic-bezier(.34,1.56,.64,1)' }}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <h3 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-800'}`}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-xl transition-colors ${dark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                    >
                        <Icon path={IC.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1">{children}</div>
            </div>
        </div>
    );
};

export default Modal;