import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

const TrialWarningBanner = () => {
    const { user } = useSelector((state) => state.auth);
    const [isVisible, setIsVisible] = useState(true);
    const [daysLeft, setDaysLeft] = useState(null);

    useEffect(() => {
        if (!user?.subscription?.trialEndsAt || user?.subscription?.status !== 'trialing') {
            return;
        }

        const checkDaysLeft = () => {
            const endsAt = new Date(user.subscription.trialEndsAt);
            const now = new Date();
            const diff = Math.max(0, endsAt - now);
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            setDaysLeft(days);
        };

        checkDaysLeft();
        const interval = setInterval(checkDaysLeft, 1000 * 60 * 60); // Check every hour
        return () => clearInterval(interval);
    }, [user?.subscription]);

    // Only show if 2 days or less remaining and banner wasn't dismissed
    if (!isVisible || daysLeft === null || daysLeft > 2) {
        return null;
    }

    return (
        <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-sm font-medium text-amber-800">
                            <strong className="font-bold">Trial expiring soon!</strong> Your Pro features will be disabled in {daysLeft === 0 ? 'less than a day' : `${daysLeft} day${daysLeft > 1 ? 's' : ''}`}.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/billing" 
                            className="whitespace-nowrap px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                        >
                            Upgrade Now
                        </Link>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="p-1 rounded-md hover:bg-amber-100 text-amber-600 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialWarningBanner;
