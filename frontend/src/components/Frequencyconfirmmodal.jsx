// ─── FrequencyConfirmModal.jsx ────────────────────────────────────────────────
import Modal from './Modal';
import Icon, { IC } from './Icon';

/**
 * Props:
 *  show        — boolean
 *  onClose     — () => void  (closes entirely, called on Escape/backdrop)
 *  onBack      — () => void  (goes back to FrequencyEditModal)
 *  onConfirm   — () => void  (saves the frequency change)
 *  freqJug     — jug object | null
 *  pendingFreq — string (the frequency selected in the edit modal)
 *  dark        — boolean
 *  theme       — { border, D } tokens from CustomerPage
 */
const FrequencyConfirmModal = ({
    show,
    onClose,
    onBack,
    onConfirm,
    freqJug,
    pendingFreq,
    dark,
    theme,
}) => {
    const { border, D } = theme;

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Confirm Update"
            dark={dark}
            maxWidth="max-w-sm"
        >
            <div className="p-6 space-y-4">

                {/* Info banner */}
                <div className={`flex gap-3 p-4 rounded-xl border ${D ? 'bg-blue-900/20 border-blue-800/60' : 'bg-blue-50 border-blue-100'}`}>
                    <Icon path={IC.refresh} className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className={`text-sm leading-relaxed ${D ? 'text-blue-300' : 'text-blue-800'}`}>
                        Are you sure you want to update the refill frequency
                        {freqJug && (
                            <> for <strong className="font-mono">{freqJug.id}</strong></>
                        )} to <strong>{pendingFreq}</strong>?
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${D ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Go Back
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-md"
                    >
                        Yes, Update
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FrequencyConfirmModal;