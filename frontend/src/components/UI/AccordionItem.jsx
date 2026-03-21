import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const AccordionItem = ({ title, icon: Icon, children, defaultOpen = false, className = '' }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 ${className} ${isOpen ? 'shadow-sm' : ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 sm:p-5 bg-white hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className={`p-2 rounded-full ${isOpen ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={20} />
                        </div>
                    )}
                    <div className="text-left">
                        <h3 className={`font-bold text-base ${isOpen ? 'text-slate-800' : 'text-slate-600'}`}>
                            {title}
                        </h3>
                    </div>
                </div>
                {isOpen ? (
                    <ChevronUp className="text-slate-400" size={20} />
                ) : (
                    <ChevronDown className="text-slate-400" size={20} />
                )}
            </button>

            {isOpen && (
                <div className="border-t border-slate-100 p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default AccordionItem;
