import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Plus,
    BarChart2,
    LayoutGrid,
    User,
    CreditCard,
    Mail,
    HelpCircle,
    QrCode
} from 'lucide-react';

const Sidebar = ({ isOpen, overlay = false }) => {
    const primaryNav = [
        { id: 'create', label: 'Create QR', icon: <Plus size={20} />, path: '/create' },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics' },
        { id: 'qrcodes', label: 'My QR Codes', icon: <LayoutGrid size={20} />, path: '/qrcodes' },
        { id: 'account', label: 'My Account', icon: <User size={20} />, path: '/account' },
        { id: 'billing', label: 'Billing', icon: <CreditCard size={20} />, path: '/billing' },
    ];

    const secondaryNav = [
        { id: 'contact', label: 'Contact', icon: <Mail size={20} />, path: '/contact' },
        { id: 'faqs', label: 'FAQs', icon: <HelpCircle size={20} />, path: '/faqs' },
    ];

    return (
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

                <div className="pt-8 pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support</div>
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
                ))}
            </nav>

            {/* Upgrade Card */}
            <div className="px-4 py-8 mt-auto w-full">
                <div className="group relative flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 transition-all duration-300 hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    
                    {/* Subtle background glow that appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Icon/Avatar for the Tier */}
                    <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                        <span className="text-xs font-black">PV</span>
                    </div>

                    <div className="relative flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.1em] leading-none mb-1">Active Tier</span>
                        <h4 className="text-[13px] font-bold text-slate-800 truncate">Pro Vibe</h4>
                    </div>

                    {/* Minimalist Upgrade Action */}
                    <NavLink 
                        to="/billing" 
                        className="relative ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/01/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </NavLink>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
