import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, LogOut, ScanLine, QrCode, MessageCircle, Save } from 'lucide-react';
import { logout, loadUser } from '../redux/authSlice';
import api from '../api/axios';

const AccountPage = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [qrCodes, setQrCodes] = useState([]);

    useEffect(() => {
        const fetchQRCodes = async () => {
            try {
                const { data } = await api.get('/qrcodes/myqrs');
                setQrCodes(data);
            } catch (err) {
                console.error("Failed to load QR codes for stats", err);
            }
        };
        fetchQRCodes();
    }, []);

    const [whatsappString, setWhatsappString] = useState(user?.whatsappNumber || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

    const handleSaveWhatsapp = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            await api.put('/users/profile', { whatsappNumber: whatsappString });
            await dispatch(loadUser());
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error("Failed to save WhatsApp number", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.stats?.total_scans || 0), 0);
    const totalCodes = qrCodes.length;

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-full">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-3xl font-extrabold mb-1">My Account</h1>
                <p className="text-slate-500 text-sm font-medium">
                    Manage your profile, view summary statistics, and account settings.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: User Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-3xl border border-slate-200 bg-indigo-100 text-indigo-700 font-extrabold text-4xl flex flex-col items-center justify-center mb-6 shadow-inner">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">{user?.name || 'User'}</h2>
                        <p className="text-sm font-medium text-slate-500 mb-8">{user?.email}</p>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Right Column: Account Details & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* User Details Form Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Full Name</label>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <User className="w-5 h-5 text-slate-400" />
                                    <p className="font-semibold text-slate-900">{user?.name}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Email Address</label>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                    <p className="font-semibold text-slate-900">{user?.email}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Account Created</label>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <p className="font-semibold text-slate-900">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                            
                            <hr className="border-slate-100 my-6" />
                            
                            {/* WhatsApp Alerts Field */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
                                    <span>WhatsApp Health Alerts</span>
                                    {saveStatus === 'success' && <span className="text-emerald-500 normal-case">Saved!</span>}
                                    {saveStatus === 'error' && <span className="text-red-500 normal-case">Error saving</span>}
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                        <MessageCircle className="w-5 h-5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-none outline-none font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                                            placeholder="+1234567890 (International format)"
                                            value={whatsappString}
                                            onChange={(e) => setWhatsappString(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveWhatsapp}
                                        disabled={isSaving || whatsappString === (user?.whatsappNumber || '')}
                                        className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-2">
                                    We will dispatch an urgent WhatsApp text to this number immediately if any of your QR code destination links break and return a 404 or 500 status code.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <QrCode className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total QR Codes</p>
                                <h4 className="text-2xl font-black text-slate-900">{totalCodes}</h4>
                            </div>
                        </div>
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <ScanLine className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Scans</p>
                                <h4 className="text-2xl font-black text-slate-900">{totalScans.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
