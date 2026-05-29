import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap, X } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose, type = 'locked' }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const content = {
        locked: {
            title: "Unlock your QR Code",
            description: "To edit this link or view its analytics, upgrade to the Business Pro plan.",
            icon: <Lock className="w-8 h-8 text-amber-500" />
        },
        limit: {
            title: "Limit Reached",
            description: "You have reached your limit of 5 Dynamic QR Codes on the free plan. Upgrade to create unlimited QRs.",
            icon: <Zap className="w-8 h-8 text-amber-500" />
        },
        premium_feature: {
            title: "Premium Feature",
            description: "Folders and Custom UTM Tracking are available on Local, Starter, and Growth plans. Upgrade to unlock.",
            icon: <Zap className="w-8 h-8 text-amber-500" />
        }
    };

    const currentContent = content[type] || content.locked;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="relative p-6">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center mt-4">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                            {currentContent.icon}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            {currentContent.title}
                        </h2>
                        
                        <p className="text-slate-600 mb-8 max-w-[280px]">
                            {currentContent.description}
                        </p>

                        <div className="w-full space-y-3">
                            <button
                                onClick={() => navigate('/billing')}
                                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Zap size={18} className="text-indigo-200" />
                                Upgrade to Pro
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
