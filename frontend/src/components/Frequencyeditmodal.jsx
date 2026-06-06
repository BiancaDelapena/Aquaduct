// ─── FrequencyEditModal.jsx ───────────────────────────────────────────────────
import Modal from './Modal';

const FREQ_OPTIONS = ['1 week', '2 weeks', '3 weeks', '1 month'];

/**
 * Props:
 *  show         — boolean
 *  onClose      — () => void  (cancels and closes)
 *  onContinue   — () => void  (advances to confirm modal)
 *  freqJug      — jug object | null
 *  pendingFreq  — string (currently selected frequency)
 *  setPendingFreq — (val: string) => void
 *  dark         — boolean
 *  theme        — { text, muted, D } tokens from CustomerPage
 */
const FrequencyEditModal = ({
    show,
    onClose,
    onContinue,
    freqJug,
    pendingFreq,
    setPendingFreq,
    dark,
    theme,
}) => {
    const { text, muted, D } = theme;

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Edit Refill Frequency"
            dark={dark}
            maxWidth="max-w-sm"
        >
            <div className="p-6 space-y-4">

                {/* Jug identifier pill */}
                {freqJug && (
                    <div className={`px-4 py-2.5 rounded-xl border text-sm font-mono font-bold ${D ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {freqJug.id} · {freqJug.type}
                    </div>
                )}

                {/* Frequency option grid */}
                <div className="grid grid-cols-2 gap-2">
                    {FREQ_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            onClick={() => setPendingFreq(opt)}
                            className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${pendingFreq === opt
                                    ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                                    : D
                                        ? 'border-slate-700 hover:border-slate-500 text-slate-300'
                                        : 'border-slate-200 hover:border-blue-300 text-slate-700'
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Continue */}
                <button
                    disabled={!pendingFreq}
                    onClick={onContinue}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${pendingFreq
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : D
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    Continue
                </button>
            </div>
        </Modal>
    );
};

export default FrequencyEditModal;