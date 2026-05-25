import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Shield, Download, Trash2, AlertTriangle, CheckCircle, Bell, X, Phone } from 'lucide-react';
import { logout, loadUser } from '../redux/authSlice';
import api from '../api/axios';

const PrivacyDataPage = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Privacy toggles
    const [whatsappOptIn, setWhatsappOptIn] = useState(false);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [privacyError, setPrivacyError] = useState(null);

    // WhatsApp number collection modal
    const [showNumberModal, setShowNumberModal] = useState(false);
    const [pendingNumber, setPendingNumber] = useState('');

    // Erasure modal
    const [showErasureModal, setShowErasureModal] = useState(false);
    const [erasurePassword, setErasurePassword] = useState('');
    const [erasureLoading, setErasureLoading] = useState(false);
    const [erasureError, setErasureError] = useState(null);

    // Export logic
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        if (user && user.whatsappOptIn !== undefined) {
            setWhatsappOptIn(user.whatsappOptIn);
        }
    }, [user]);

    const handleToggleWhatsapp = async () => {
        setPrivacyError(null);
        const newState = !whatsappOptIn;

        // If turning ON and no number on file → open the number collection modal
        if (newState === true && !user?.whatsappNumber) {
            setPendingNumber('');
            setShowNumberModal(true);
            return;
        }

        // Otherwise, toggle directly
        await submitPrivacyToggle({ whatsappOptIn: newState });
    };

    const handleNumberModalSubmit = async () => {
        if (!pendingNumber.trim()) {
            setPrivacyError("Please enter a valid WhatsApp number.");
            return;
        }
        setShowNumberModal(false);
        // Send both the number AND the opt-in flag in one request
        await submitPrivacyToggle({ whatsappOptIn: true, whatsappNumber: pendingNumber.trim() });
    };

    const submitPrivacyToggle = async (payload) => {
        setSavingPrivacy(true);
        setPrivacyError(null);
        try {
            const response = await api.put('/users/privacy', payload);
            setWhatsappOptIn(response.data.whatsappOptIn);
            await dispatch(loadUser());
        } catch (error) {
            console.error("Failed to update privacy settings", error);
            setPrivacyError(error.response?.data?.message || "Failed to update settings.");
            // Revert to the server state on failure
            setWhatsappOptIn(user?.whatsappOptIn ?? false);
        } finally {
            setSavingPrivacy(false);
        }
    };

    const handleExportData = async () => {
        setExportLoading(true);
        try {
            const response = await api.get('/users/export', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `qrvibe_data_${user?._id || 'export'}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export data", error);
            alert("Failed to export data. Please try again later.");
        } finally {
            setExportLoading(false);
        }
    };

    const openErasureModal = () => {
        setErasurePassword('');
        setErasureError(null);
        setShowErasureModal(true);
    };

    const handleErasure = async () => {
        if (!erasurePassword) {
            setErasureError("You must enter your password to confirm deletion.");
            return;
        }

        setErasureLoading(true);
        setErasureError(null);
        try {
            await api.delete('/users/erasure', { data: { password: erasurePassword } });
            setShowErasureModal(false);
            alert("Your account and all associated data have been permanently deleted.");
            await dispatch(logout());
            navigate('/');
        } catch (error) {
            console.error("Erasure failed", error);
            setErasureError(error.response?.data?.message || "Failed to delete account. Please ensure your password is correct.");
        } finally {
            setErasureLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 bg-slate-50 min-h-full">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold mb-1">Privacy & Data</h1>
                <p className="text-slate-500 text-sm font-medium">
                    Manage consent, exports, and erasure requests for DPDP compliance.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Toggles and Export */}
                <div className="space-y-6">
                    {/* Privacy Settings */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                                <Shield className="w-5 h-5 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Privacy Preferences</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                                <div>
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-slate-600" />
                                        WhatsApp Health Alerts
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1 pr-4">
                                        Allow QRVibe to send you automated WhatsApp alerts when your links break. We securely log your consent for DPDP compliance.
                                    </p>
                                    {user?.whatsappNumber && (
                                        <p className="text-xs text-slate-700 font-semibold mt-2">
                                            Linked: {user.whatsappNumber}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleToggleWhatsapp}
                                    disabled={savingPrivacy}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${whatsappOptIn ? 'bg-slate-900' : 'bg-slate-200'} ${savingPrivacy ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${whatsappOptIn ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {privacyError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100">
                                    {privacyError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Export */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center">
                                <Download className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Data Portability</h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-6">
                            Download a copy of all data associated with your account, including your profile, QR codes, scan statistics, and consent history.
                        </p>
                        <button
                            onClick={handleExportData}
                            disabled={exportLoading}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {exportLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Download My Data (JSON)
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: Danger Zone */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-red-100 shadow-sm p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-50 rounded-md flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
                        </div>
                        
                        <h4 className="font-bold text-slate-900 mb-2">Right to be Forgotten</h4>
                        <p className="text-sm font-medium text-slate-500 mb-6">
                            Permanently delete your account and wipe all associated data. This action is irreversible. All active QR codes will immediately break.
                        </p>

                        <div className="space-y-4 bg-red-50 p-5 rounded-lg border border-red-100 mb-6">
                            <h5 className="text-xs font-bold uppercase tracking-widest text-red-600">What happens:</h5>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-sm text-red-900 font-medium">
                                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    Profile, billing history, and preferences are wiped.
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-900 font-medium">
                                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    All QR codes and analytics data are permanently deleted.
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-900 font-medium">
                                    <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                    Your consent ledger and alert events are removed.
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={openErasureModal}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                            Delete My Account
                        </button>
                    </div>
                </div>
            </div>

            {/* ==========================================
                WHATSAPP NUMBER COLLECTION MODAL
               ========================================== */}
            {showNumberModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => setShowNumberModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-6 h-6 text-slate-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Add WhatsApp Number</h3>
                                <p className="text-xs text-slate-500 font-medium">Required to receive health alerts.</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 font-medium mb-6">
                            Enter your WhatsApp number in international format (e.g., +919876543210). We'll use this number exclusively for QR code health alerts.
                        </p>

                        <div className="mb-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                WhatsApp Number
                            </label>
                            <input
                                type="tel"
                                value={pendingNumber}
                                onChange={(e) => setPendingNumber(e.target.value)}
                                placeholder="+919876543210"
                                autoFocus
                                className="w-full border border-slate-200 bg-white rounded-lg p-4 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-900/10 transition-all font-semibold"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNumberModal(false)}
                                className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-md font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNumberModalSubmit}
                                disabled={!pendingNumber.trim() || savingPrivacy}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingPrivacy ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Bell className="w-4 h-4" />
                                        Save & Enable Alerts
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==========================================
                ERASURE CONFIRMATION MODAL
               ========================================== */}
            {showErasureModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => setShowErasureModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Confirm Account Deletion</h3>
                                <p className="text-xs text-slate-500 font-medium">This action is permanent and cannot be undone.</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 font-medium mb-6">
                            To verify your identity, please enter your account password below. All QR codes, analytics, and personal data will be erased immediately.
                        </p>

                        {erasureError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold">
                                {erasureError}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                                Your Password
                            </label>
                            <input
                                type="password"
                                value={erasurePassword}
                                onChange={(e) => setErasurePassword(e.target.value)}
                                placeholder="Enter your password"
                                autoFocus
                                className="w-full border border-slate-200 bg-white rounded-lg p-4 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-semibold"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowErasureModal(false)}
                                className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-md font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleErasure}
                                disabled={erasureLoading || !erasurePassword}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {erasureLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Confirm Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrivacyDataPage;
