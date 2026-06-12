// ─── ChatWidget.jsx ───────────────────────────────────────────────────────────
import Icon, { IC } from './MyIcons';

/**
 * Props:
 *  dark   — boolean (dark mode flag)
 *  theme  — { muted, border, inp, D } tokens from CustomerPage
 *  onClose — () => void
 */
const ChatWidget = ({ dark, theme, onClose }) => {
    const { muted, border, inp, D } = theme;

    return (
        <div
            className={`fixed bottom-24 left-6 z-40 w-72 sm:w-80 rounded-2xl shadow-2xl border overflow-hidden ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            style={{ animation: 'slideUp 0.2s ease' }}
        >
            {/* Header */}
            <div className="bg-slate-800 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                    <Icon path={IC.chat} className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold">Aquaduct Support</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <Icon path={IC.x} className="w-4 h-4" />
                </button>
            </div>

            {/* Body placeholder */}
            <div className={`p-6 h-64 flex items-center justify-center ${D ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <p className={`text-sm text-center ${muted}`}>
                    How can we help with your water logistics today?
                </p>
            </div>

            {/* Input */}
            <div className={`p-3 border-t ${border} ${D ? 'bg-slate-900' : 'bg-white'}`}>
                <input
                    type="text"
                    placeholder="Type a message…"
                    className={`w-full px-4 py-2 rounded-xl border text-sm outline-none transition-colors ${inp}`}
                />
            </div>
        </div>
    );
};

export default ChatWidget;