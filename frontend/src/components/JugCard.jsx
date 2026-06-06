// ─── JugCard.jsx ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Icon, { IC } from './Icon';
import StatusBadge from './StatusBadge';

/**
 * Props:
 *  jug             — jug object { id, type, status, lastRefill, nextRefill, frequency }
 *  dark            — boolean (dark mode flag)
 *  theme           — { text, muted, hov, D } tokens from CustomerPage
 *  onToggleStatus  — (jugId) => void
 *  onOpenFreqModal — (jug) => void
 */
const JugCard = ({ jug, dark, theme, onToggleStatus, onOpenFreqModal }) => {
    const { text, muted, hov, D } = theme;
    const [menuOpen, setMenuOpen] = useState(false);

    // Close dropdown on outside click
    useEffect(() => {
        const fn = (e) => { if (!e.target.closest('[data-jugmenu]')) setMenuOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const isToggleable = jug.status === 'ACTIVE' || jug.status === 'INACTIVE';

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 transition-colors ${hov}`}>

            {/* Icon */}
            <div className={`p-3 rounded-xl self-start flex-shrink-0 ${D ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <Icon
                    path={IC.droplet}
                    className={`w-5 h-5 ${jug.status === 'ACTIVE' ? 'text-blue-500' : D ? 'text-slate-600' : 'text-slate-400'}`}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className={`font-bold font-mono text-sm ${text}`}>{jug.id}</div>
                <div className={`text-xs mt-0.5 ${muted}`}>{jug.type} • Last refill: {jug.lastRefill}</div>
                <div className={`text-xs mt-0.5 ${muted}`}>Next refill: {jug.nextRefill}</div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">

                {/* Frequency */}
                <div className="text-right min-w-0">
                    <div className={`text-xs ${muted}`}>Frequency</div>
                    <div className={`text-sm font-semibold flex items-center gap-1.5 ${text}`}>
                        {jug.frequency}
                        {jug.status === 'ACTIVE' && (
                            <button
                                onClick={() => onOpenFreqModal(jug)}
                                className={`p-0.5 rounded transition-colors ${D ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}`}
                                title="Edit frequency"
                            >
                                <Icon path={IC.edit} className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <StatusBadge status={jug.status} dark={dark} />

                {/* Three-dot dropdown */}
                {isToggleable && (
                    <div className="relative" data-jugmenu>
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className={`p-1.5 rounded-xl transition-colors ${D ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                        >
                            <Icon path={IC.more} className="w-5 h-5" />
                        </button>

                        {menuOpen && (
                            <div
                                className={`absolute right-0 top-full mt-1 rounded-xl shadow-2xl z-20 overflow-hidden border min-w-[180px] ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                                style={{ animation: 'modalPop 0.12s cubic-bezier(.34,1.56,.64,1)' }}
                            >
                                <button
                                    onClick={() => { onToggleStatus(jug.id); setMenuOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${jug.status === 'ACTIVE'
                                        ? D ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
                                        : D ? 'text-emerald-400 hover:bg-slate-800' : 'text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                >
                                    <Icon path={jug.status === 'ACTIVE' ? IC.pause : IC.play} className="w-4 h-4" />
                                    {jug.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                                </button>

                                {jug.status === 'ACTIVE' && (
                                    <>
                                        <div className={`h-px mx-3 ${D ? 'bg-slate-800' : 'bg-slate-100'}`} />
                                        <button className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${D ? 'text-red-400 hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'}`}>
                                            <Icon path={IC.alert} className="w-4 h-4" /> Report Lost
                                        </button>
                                        <button className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${D ? 'text-orange-400 hover:bg-slate-800' : 'text-orange-600 hover:bg-orange-50'}`}>
                                            <Icon path={IC.xCircle} className="w-4 h-4" /> Report Broken
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JugCard;