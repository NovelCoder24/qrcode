import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import api from '../api/axios';
import { updateSubscriptionStatus } from '../redux/authSlice';

const TrialExpiredModal = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    useEffect(() => {
        if (
            user?.subscription?.status === 'expired' && 
            user?.subscription?.hasSeenTrialExpiredPopup === false
        ) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [user?.subscription]);

    const handleDismiss = async () => {
        setIsDismissing(true);
        try {
            await api.put('/users/dismiss-trial-warning');
            // Update local Redux state so it doesn't reappear
            if (user && user.subscription) {
                dispatch(updateSubscriptionStatus({
                    ...user.subscription,
                    hasSeenTrialExpiredPopup: true
                }));
            }
            setIsVisible(false);
        } catch (error) {
            console.error("Failed to dismiss modal", error);
        } finally {
            setIsDismissing(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Trial Expired</h2>
                    <p className="text-slate-500 mb-6 text-sm">
                        Your free trial has ended. To maintain system limits, only your <strong>5 most recently created QR codes</strong> remain active. The rest have been paused.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/billing"
                            onClick={handleDismiss} // Also dismiss when they click upgrade to not annoy them if they return
                            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-200"
                        >
                            Upgrade Now
                        </Link>
                        <button
                            onClick={handleDismiss}
                            disabled={isDismissing}
                            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-colors"
                        >
                            {isDismissing ? 'Dismissing...' : 'I Understand'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialExpiredModal;
