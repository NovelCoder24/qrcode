import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { ModernTemplate, PlayfulTemplate } from '../components/MenuTemplates/BasicTemplates';
import ImmersiveTemplate from '../components/MenuTemplates/ImmersiveTemplate';
import LighthouseTemplate from '../components/MenuTemplates/LighthouseTemplate';
import ReviewFunnel from '../components/MenuTemplates/ReviewFunnel';

const MenuViewPage = () => {
    const { shortId } = useParams();
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiBase = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${apiBase}/r/info/${shortId}`);
                setQrData(data);
            } catch (err) {
                setError(err.response?.data?.message || 'This menu could not be found.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [shortId, apiBase]);

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading Menu...</p>
                </div>
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Menu Not Found</h1>
                    <p className="text-slate-500 text-sm">{error || 'This menu does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (!qrData.isActive) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Menu Offline</h1>
                    <p className="text-slate-500 text-sm">This menu is currently deactivated.</p>
                </div>
            </div>
        );
    }

    const meta = qrData.metadata || {};
    const businessCategory = meta.businessCategory || qrData.businessCategory || 'salon';
    const restaurantName = meta.restaurantName || qrData.title || (businessCategory === 'salon' ? 'Our Salon & Studio' : 'Our Menu');
    const currency = meta.currency || '₹';
    const categories = Array.isArray(meta.categories) ? meta.categories : [];
    const template = meta.menuTemplate || 'modern'; // immersive, lighthouse, modern, playful
    const googleReviewUrl = meta.googleReviewUrl || '';
    const shieldPhone = meta.shieldPhone || meta.whatsappNumber || '';
    const resolutionOffer = meta.resolutionOffer || '20% off next visit & direct resolution';
    const enableReviewBooster = meta.enableReviewBooster !== false;

    const renderTemplate = () => {
        if (template === 'immersive') {
            return (
                <ImmersiveTemplate
                    restaurantName={restaurantName}
                    currency={currency}
                    categories={categories}
                    businessCategory={businessCategory}
                />
            );
        }
        if (template === 'lighthouse') {
            return (
                <LighthouseTemplate
                    restaurantName={restaurantName}
                    currency={currency}
                    categories={categories}
                    businessCategory={businessCategory}
                />
            );
        }
        if (template === 'playful') {
            return (
                <PlayfulTemplate
                    restaurantName={restaurantName}
                    currency={currency}
                    categories={categories}
                    businessCategory={businessCategory}
                />
            );
        }
        return (
            <ModernTemplate
                restaurantName={restaurantName}
                currency={currency}
                categories={categories}
                businessCategory={businessCategory}
            />
        );
    };

    const cleanPhone = shieldPhone ? String(shieldPhone).replace(/\D/g, '') : '';
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const bookingMsg = `Hi, I'm browsing your rate card at ${restaurantName} and would like to book an appointment.`;
    const waBookingUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(bookingMsg)}` : '';

    return (
        <div className="relative min-h-screen">
            {renderTemplate()}

            {businessCategory === 'salon' && waBookingUrl && (
                <div className="fixed bottom-16 sm:bottom-18 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] w-max pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <a
                        href={waBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl backdrop-blur-md text-xs font-bold tracking-tight transition-all active:scale-95 border border-emerald-400/40"
                    >
                        <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                        <span>Book Next Visit on WhatsApp</span>
                    </a>
                </div>
            )}

            {enableReviewBooster && (
                <ReviewFunnel
                    businessCategory={businessCategory}
                    restaurantName={restaurantName}
                    googleReviewUrl={googleReviewUrl}
                    shieldPhone={shieldPhone}
                    categories={categories}
                    resolutionOffer={resolutionOffer}
                />
            )}
        </div>
    );
};

export default MenuViewPage;
