// ─── EditProfileModal.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Modal from './Modal';
import Icon, { IC } from './Icon';
import API from '../api';

/**
 * Props:
 *  show        — boolean
 *  onClose     — () => void
 *  onContinue  — (formData) => void  (passes form data to confirmation modal)
 *  profileData — { name, email, phone } | null
 *  dark        — boolean
 *  theme       — { text, muted, border, inp, D } tokens
 */
const EditProfileModal = ({ show, onClose, onContinue, profileData, dark, theme }) => {
    const { text, muted, border, inp, D } = theme;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Initialize form with current profile data
    useEffect(() => {
        if (show && profileData) {
            setName(profileData.name || '');
            setEmail(profileData.email || '');
            setPhone(profileData.phone_number || '');
        }
    }, [show, profileData]);

    const handleContinue = () => {
        if (name.trim() && email.trim() && phone.trim()) {
            onContinue({ name, email, phone });
        }
    };

    const isComplete = name.trim() && email.trim() && phone.trim();

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Edit Profile Information"
            dark={dark}
            maxWidth="max-w-lg"
        >
            <div className="p-6 space-y-5">
                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
                        Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter your name or nickname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
                    />
                </div>

                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
                    />
                </div>

                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${inp}`}
                    />
                </div>

                <div className="pt-2" style={{ borderColor: 'inherit' }}>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${D ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
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
                            Review Changes
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EditProfileModal;
