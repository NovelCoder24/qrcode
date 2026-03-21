import React from 'react';
import { Menu, X, QrCode } from 'lucide-react';

const Header = ({ onToggle, isOpen }) => {
    return (
        <header className='fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 lg:hidden'>
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <QrCode className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">QR<span className="text-indigo-600">Vibe</span></span>
            </div>

            <button
                onClick={onToggle}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </header>
    );
};

export default Header;