import React from 'react';
import { Menu, X } from 'lucide-react';
import qrvibeLogoPrimary from '../assets/qrvibe-logo-primary.svg';

const Header = ({ onToggle, isOpen }) => {
    return (
        <header className='fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 lg:hidden'>
            <div className="flex items-center">
                <img src={qrvibeLogoPrimary} alt="QRVibe Logo" className="h-10 w-auto object-contain" />
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