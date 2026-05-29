import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
    PlusCircle,
    BarChart2,
    LayoutDashboard,
    QrCode,
    CreditCard,
    Bell,
    Settings,
    Shield,
    Folder
} from 'lucide-react';
import UpgradeModal from './UpgradeModal';
import qrvibeLogoPrimary from '../assets/qrvibe-logo-primary.svg';

const Sidebar = ({ isOpen, overlay = false, onClose }) => {
    const primaryNav = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'qrcodes', label: 'My QR Codes', icon: QrCode, path: '/qrcodes' },
        { id: 'folders', label: 'Folders', icon: Folder, path: '/folders' },
        { id: 'create', label: 'Create QR', icon: PlusCircle, path: '/create', gated: true },
        { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/analytics' },
        { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
        { id: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
        { id: 'privacy', label: 'Privacy & Data', icon: Shield, path: '/privacy-data' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/account' },
    ];

    const { user } = useSelector((state) => state.auth);
    const subscription = user?.subscription;

    const [showLimitModal, setShowLimitModal] = useState(false);

    // Plan info for bottom card
    const planName = subscription?.plan === 'business' ? 'Business Plan'
        : subscription?.plan === 'pro' ? 'Pro Plan'
        : subscription?.plan === 'basic' ? 'Basic Plan'
        : 'Starter Plan';
    const dynamicLimit = subscription?.dynamicQrLimit || 5;
    const used = user?.activeQrCount ?? 0;
    const progressPercent = dynamicLimit > 0 ? Math.min(100, (used / dynamicLimit) * 100) : 0;

    return (
        <>
        <aside className={`
            fixed top-0 left-0 z-50
            h-screen w-64 bg-[#F8F8F8] border-r border-slate-200
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : `-translate-x-full ${overlay ? '' : 'lg:translate-x-0'}`}
            flex flex-col
        `}>
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-slate-100">
                <img src={qrvibeLogoPrimary} alt="QRVibe" className="w-auto object-contain" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {primaryNav.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            onClick={(e) => {
                                if (item.gated) {
                                    if (subscription?.plan === 'free' && user?.activeQrCount >= subscription?.dynamicQrLimit) {
                                        e.preventDefault();
                                        setShowLimitModal(true);
                                        return;
                                    }
                                }
                                onClose?.();
                            }}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors
                                ${isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                            `}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Plan Card */}
            <div className="px-4 py-4 border-t border-slate-100">
                <NavLink to="/billing" className="block" onClick={() => onClose?.()}>
                    <p className="text-sm font-bold text-slate-800">{planName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{used}/{dynamicLimit} QR codes used</p>
                    <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </NavLink>
            </div>
        </aside>

        <UpgradeModal
            isOpen={showLimitModal}
            onClose={() => setShowLimitModal(false)}
            type="limit"
        />
        </>
    );
};

export default Sidebar;
