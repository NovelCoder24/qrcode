import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
    Plus,
    BarChart2,
    LayoutGrid,
    User,
    CreditCard,
    Mail,
    HelpCircle,
    QrCode,
    Shield
} from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const Sidebar = ({ isOpen, overlay = false }) => {
    const primaryNav = [
        { id: 'create', label: 'Create QR', icon: <Plus size={20} />, path: '/create' },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics' },
        { id: 'qrcodes', label: 'My QR Codes', icon: <LayoutGrid size={20} />, path: '/qrcodes' },
        { id: 'account', label: 'My Account', icon: <User size={20} />, path: '/account' },
        { id: 'billing', label: 'Billing', icon: <CreditCard size={20} />, path: '/billing' },
        { id: 'privacy', label: 'Privacy & Data', icon: <Shield size={20} />, path: '/privacy-data' },
    ];

    const secondaryNav = [
        { id: 'contact', label: 'Contact', icon: <Mail size={20} />, path: '/contact' },
        { id: 'faqs', label: 'FAQs', icon: <HelpCircle size={20} />, path: '/faqs' },
    ];

    const { user } = useSelector((state) => state.auth);
    const subscription = user?.subscription;
    const isTrialing = subscription?.status === 'trialing';

    const [daysLeft, setDaysLeft] = useState(0);
    const [showLimitModal, setShowLimitModal] = useState(false);

    useEffect(() => {
        if (!subscription?.trialEndsAt) return;
        const interval = setInterval(() => {
            const endsAt = new Date(subscription.trialEndsAt);
            const now = new Date();
            const diff = Math.max(0, endsAt - now);
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setDaysLeft(days);
        }, 1000);
        return () => clearInterval(interval);
    }, [subscription?.trialEndsAt]);

    return (
        <>
        <aside className={`
            fixed top-0 left-0 z-50
            ${overlay ? '' : 'lg:sticky'}
            h-screen w-72 bg-white border-r border-slate-200
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : `-translate-x-full ${overlay ? '' : 'lg:translate-x-0'}`}
            flex flex-col shadow-2xl lg:shadow-none
        `}>
            {/* Logo Section */}
            <div className="p-8 flex items-center gap-2 mb-4">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <QrCode className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">QR<span className="text-indigo-600">Vibe</span></span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto w-full">
                {primaryNav.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        onClick={(e) => {
                            if (item.id === 'create') {
                                if (subscription?.plan === 'free' && user?.activeQrCount >= subscription?.dynamicQrLimit) {
                                    e.preventDefault();
                                    setShowLimitModal(true);
                                }
                            }
                        }}
                        className={({ isActive }) => `
                            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                            ${isActive
                                ? 'bg-indigo-50 text-indigo-700 font-bold text-sm'
                                : 'text-slate-500 hover:bg-slate-50 font-semibold text-sm'}
                        `}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
                {/* For now disabled secondary nav i'll implement it later */}
                {/* <div className="pt-8 pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</div>
                {secondaryNav.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => `
                            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                            ${isActive
                                ? 'bg-indigo-50 text-indigo-700 font-bold text-sm'
                                : 'text-slate-500 hover:bg-slate-50 font-semibold text-sm'}
                        `}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))} */}
            </nav>

            {/* Subscription Card */}
            <div className="px-4 py-8 mt-auto w-full">
                <div className="group relative flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 transition-all duration-300 hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    
                    {/* Subtle background glow that appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Icon/Avatar for the Tier */}
                    <div className={`relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-lg ${
                        subscription?.status === 'active' ? 'bg-emerald-600 shadow-emerald-200' 
                        : subscription?.status === 'canceled' || subscription?.status === 'expired' ? 'bg-slate-400 shadow-slate-200' 
                        : 'bg-indigo-600 shadow-indigo-200'
                    }`}>
                        <span className="text-xs font-black">
                            {subscription?.plan === 'business' ? 'AG' : subscription?.plan === 'pro' ? 'PV' : 'FR'}
                        </span>
                    </div>

                    <div className="relative flex flex-col min-w-0 flex-1">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.1em] leading-none mb-1 truncate ${
                            subscription?.status === 'active' ? 'text-emerald-500'
                            : subscription?.status === 'canceled' ? 'text-amber-500'
                            : subscription?.status === 'expired' ? 'text-red-500'
                            : isTrialing ? 'text-indigo-500'
                            : 'text-slate-400'
                        }`}>
                            {subscription?.status === 'active' ? 'Active Plan'
                            : subscription?.status === 'canceled' ? 'Canceling'
                            : subscription?.status === 'expired' ? 'Plan Expired'
                            : isTrialing ? 'Trial Active'
                            : 'Free Tier'}
                        </span>
                        <h4 className="text-[13px] font-bold text-slate-800 truncate">
                            {subscription?.plan === 'pro' ? 'Pro Vibe' : subscription?.plan === 'business' ? 'Agency' : 'Free Starter'}
                        </h4>
                        {isTrialing && (
                            <p className="text-[10px] font-semibold text-amber-500 mt-0.5 truncate">{daysLeft} days left</p>
                        )}
                        {subscription?.status === 'canceled' && (
                            <p className="text-[10px] font-semibold text-amber-500 mt-0.5 truncate">Until billing period ends</p>
                        )}
                    </div>

                    {/* Action Button — show upgrade for non-active, manage for active */}
                    <NavLink 
                        to="/billing" 
                        className="relative flex-shrink-0 ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/01/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </NavLink>
                </div>
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
