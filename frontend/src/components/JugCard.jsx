// ─── JugCard.jsx ──────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import Icon, { IC } from './MyIcons';
import StatusBadge from './StatusBadge';

/**
 * Props:
 *  jug              — jug object { id, label, type, status, lastRefill, nextRefill, frequency }
 *  dark             — boolean (dark mode flag)
 *  theme            — { text, muted, hov, inp, border, D } tokens from CustomerPage
 *  onToggleStatus   — (jugId) => void  (called after confirm)
 *  onUpdateFreq     — (jug, days, enabled) => void  (called on save)
 */
const JugCard = ({ jug, dark, theme, onToggleStatus, onUpdateFreq }) => {
    const { text, muted, hov, D, inp, border } = theme;

    // ── Status dropdown ───────────────────────────────────────────────────
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // ── Frequency popover controls ────────────────────────────────────────
    const [freqOpen, setFreqOpen] = useState(false);
    const freqRef = useRef(null);

    // Derived display values from the jug prop (always in sync)
    const displayFreqDays = (() => {
        const match = jug.frequency?.match(/^(\d+)/);
        return match ? match[1] : '';
    })();
    const displayFreqEnabled = jug.frequency && jug.frequency !== '-';

    // Local state used only while the popover is open
    const [editFreqDays, setEditFreqDays] = useState(displayFreqDays);
    const [editFreqEnabled, setEditFreqEnabled] = useState(displayFreqEnabled);

    // Keep local editing state synced when the underlying jug data changes
    useEffect(() => {
        setEditFreqDays(displayFreqDays);
        setEditFreqEnabled(displayFreqEnabled);
    }, [displayFreqDays, displayFreqEnabled]);

    // Close menus on outside click
    useEffect(() => {
        const fn = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
            if (freqRef.current && !freqRef.current.contains(e.target)) setFreqOpen(false);
        };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const statusUpper = jug.status?.toUpperCase() ?? '';
    const isActive = statusUpper === 'ACTIVE';
    const isToggleable = statusUpper === 'ACTIVE' || statusUpper === 'INACTIVE';

    // ── Frequency popover save ────────────────────────────────────────────
    const handleFreqSave = () => {
        const days = parseInt(editFreqDays, 10);
        if (!editFreqEnabled) {
            onUpdateFreq?.(jug, 0, false);
        } else if (!isNaN(days) && days > 0) {
            onUpdateFreq?.(jug, days, true);
        }
        setFreqOpen(false);
    };

    const freqLabel = displayFreqEnabled && displayFreqDays
        ? `Every ${displayFreqDays} day${parseInt(displayFreqDays) === 1 ? '' : 's'}`
        : 'No schedule';

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 transition-colors ${hov}`}>

            {/* Icon or Image */}
            <div className="flex-shrink-0">
                {jug.image ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <img
                            src={jug.image.startsWith('http') ? jug.image : `http://localhost:8000${jug.image}`}
                            alt={jug.type}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className={`p-3 rounded-xl flex-shrink-0 ${D ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                        <Icon
                            path={IC.droplet}
                            className={`w-5 h-5 ${isActive ? 'text-blue-500' : D ? 'text-slate-600' : 'text-slate-400'}`}
                        />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                {/* Name – label or fallback to unique ID */}
                <div className="flex flex-col gap-0.5">
                    <div className={`font-bold font-mono text-sm ${text}`}>
                        {jug.label || jug.id}
                    </div>
                    {/* Show unique ID as tiny subtitle only if a custom label exists */}
                    {jug.label && (
                        <div className={`text-xs font-mono ${muted}`}>
                            {jug.id}
                        </div>
                    )}
                </div>
                <div className={`text-xs mt-0.5 ${muted}`}>{jug.type} • Last refill: {jug.lastRefill}</div>
                <div className={`text-xs mt-0.5 ${muted}`}>Next refill: {jug.nextRefill}</div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">

                {/* ── Frequency button → popover ──────────────────────── */}
                <div className="relative" ref={freqRef}>
                    <button
                        onClick={() => setFreqOpen(v => !v)}
                        className={`text-right px-3 py-2 rounded-xl border transition-colors ${freqOpen
                            ? D ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
                            : D ? 'border-slate-700 hover:border-slate-500 bg-slate-800/50' : 'border-slate-200 hover:border-blue-300 bg-slate-50'
                            }`}
                    >
                        <div className={`text-xs ${muted} text-left`}>Frequency</div>
                        <div className={`text-sm font-semibold flex items-center gap-1.5 mt-0.5 ${displayFreqEnabled ? text : muted}`}>
                            <Icon
                                path={IC.clock}
                                className={`w-3.5 h-3.5 flex-shrink-0 ${displayFreqEnabled ? 'text-blue-500' : muted}`}
                            />
                            {freqLabel}
                        </div>
                    </button>

                    {/* Frequency popover */}
                    {freqOpen && (
                        <div
                            className={`absolute right-0 top-full mt-2 z-40 rounded-2xl border shadow-2xl p-4 min-w-[220px] ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                            style={{ animation: 'modalPop 0.12s cubic-bezier(.34,1.56,.64,1)' }}
                        >
                            <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>
                                Refill Schedule
                            </div>

                            {/* Days input (using local editing state) */}
                            <div className="mb-3">
                                <label className={`block text-xs mb-1.5 ${muted}`}>Days before refill</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={editFreqDays}
                                    onChange={e => setEditFreqDays(e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 14"
                                    className={`w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold outline-none transition-colors ${inp}`}
                                />
                            </div>

                            {/* Enable / disable toggle (local state) */}
                            <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl border mb-3 ${D ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                                <span className={`text-xs font-semibold ${text}`}>Schedule active</span>
                                <label className="relative flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editFreqEnabled}
                                        onChange={(e) => setEditFreqEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border-2 rounded-md border-slate-400 dark:border-slate-500 peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-colors">
                                        {editFreqEnabled && (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={handleFreqSave}
                                disabled={editFreqEnabled && (!editFreqDays || parseInt(editFreqDays) < 1)}
                                className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${editFreqEnabled && (!editFreqDays || parseInt(editFreqDays) < 1)
                                    ? D ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Status ":" button → dropdown ───────────────────── */}
                {isToggleable && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            title="Change status"
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${menuOpen
                                ? D ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
                                : D ? 'border-slate-700 hover:border-slate-500 bg-slate-800/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                                }`}
                        >
                            {/* Status dot */}
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : D ? 'bg-slate-600' : 'bg-slate-400'}`} />
                            <span className={`text-sm font-semibold ${isActive ? 'text-emerald-500' : muted}`}>
                                {jug.status}
                            </span>
                            {/* Colon / ellipsis indicator */}
                            <span className={`text-xs font-black tracking-tighter leading-none ${muted}`}>⋮</span>
                        </button>

                        {menuOpen && (
                            <div
                                className={`absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-40 overflow-hidden border min-w-[160px] ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                                style={{ animation: 'modalPop 0.12s cubic-bezier(.34,1.56,.64,1)' }}
                            >
                                <button
                                    onClick={() => { onToggleStatus(jug.id); setMenuOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isActive
                                        ? D ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                                        : D ? 'text-emerald-400 hover:bg-slate-800' : 'text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                >
                                    <Icon path={isActive ? IC.pause : IC.play} className="w-4 h-4" />
                                    {isActive ? 'Set Inactive' : 'Set Active'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Non-toggleable status (e.g. Lost, Broken) still shows badge */}
                {!isToggleable && <StatusBadge status={jug.status} dark={dark} />}
            </div>
        </div>
    );
};

export default JugCard;