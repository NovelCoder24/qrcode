import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { ModernTemplate, PlayfulTemplate } from '../components/MenuTemplates/BasicTemplates';
import ImmersiveTemplate from '../components/MenuTemplates/ImmersiveTemplate';
import LighthouseTemplate from '../components/MenuTemplates/LighthouseTemplate';

const MenuViewPage = () => {
    const { shortId } = useParams();
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
    const restaurantName = meta.restaurantName || 'Our Menu';
    const currency = meta.currency || '$';
    const categories = meta.categories || [];
    const template = meta.menuTemplate || 'modern'; // immersive, lighthouse, modern, playful
    
    // Fallback styling color from QR design if they picked one
    const brandColor = qrData.customization?.fgColor || '#4F46E5';

    if (template === 'immersive') {
        return <ImmersiveTemplate restaurantName={restaurantName} currency={currency} categories={categories} />;
    }
    if (template === 'lighthouse') {
        return <LighthouseTemplate restaurantName={restaurantName} currency={currency} categories={categories} />;
    }
    if (template === 'playful') {
        return <PlayfulTemplate restaurantName={restaurantName} currency={currency} categories={categories} />;
    }

    return <ModernTemplate restaurantName={restaurantName} currency={currency} categories={categories} />;
};

export default MenuViewPage;
