import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { ModernTemplate, PlayfulTemplate } from '../components/MenuTemplates/BasicTemplates';
import ImmersiveTemplate from '../components/MenuTemplates/ImmersiveTemplate';
import LighthouseTemplate from '../components/MenuTemplates/LighthouseTemplate';
import WhatsAppCartBar from '../components/MenuTemplates/WhatsAppCartBar';
import {
    normalizeWhatsAppPhone,
    getDishCartKey,
    updateCartItemQty,
    getCartSummary,
} from '../utils/whatsappCart';

const MenuViewPage = () => {
    const { shortId } = useParams();
    const [searchParams] = useSearchParams();
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState({});

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

    const cartSummary = useMemo(() => getCartSummary(cart), [cart]);

    const getItemQty = useCallback(
        (categoryId, item, itemIdx = 0) => {
            const key = getDishCartKey(categoryId, item, itemIdx);
            return cart[key]?.qty || 0;
        },
        [cart]
    );

    const onChangeItemQty = useCallback(
        (categoryId, categoryName, item, itemIdx, delta) => {
            const key = getDishCartKey(categoryId, item, itemIdx);
            setCart((prev) =>
                updateCartItemQty(
                    prev,
                    key,
                    {
                        name: item?.name,
                        price: item?.price,
                        categoryName,
                    },
                    delta
                )
            );
        },
        []
    );

    const handleIncrementByKey = useCallback((dishKey, itemEntry) => {
        setCart((prev) => updateCartItemQty(prev, dishKey, itemEntry, 1));
    }, []);

    const handleDecrementByKey = useCallback((dishKey, itemEntry) => {
        setCart((prev) => updateCartItemQty(prev, dishKey, itemEntry, -1));
    }, []);

    const handleClearCart = useCallback(() => {
        setCart({});
    }, []);

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
    const restaurantName = meta.restaurantName || qrData.title || 'Our Menu';
    const currency = meta.currency || '₹';
    const categories = Array.isArray(meta.categories) ? meta.categories : [];
    const template = meta.menuTemplate || 'modern'; // immersive, lighthouse, modern, playful
    const whatsappNumber = meta.whatsappNumber || '';
    const orderingEnabled = Boolean(
        meta.whatsappOrderingEnabled !== false && normalizeWhatsAppPhone(whatsappNumber)
    );
    const initialTableNumber =
        searchParams.get('table') || meta.defaultTableNumber || '';

    const cartProps = {
        enabled: orderingEnabled,
        getItemQty,
        onChangeItemQty,
        hasCartItems: cartSummary.totalCount > 0,
    };

    const renderTemplate = () => {
        if (template === 'immersive') {
            return (
                <ImmersiveTemplate
                    restaurantName={restaurantName}
                    currency={currency}
                    categories={categories}
                    cartProps={cartProps}
                />
            );
        }
        if (template === 'lighthouse') {
            return (
                <LighthouseTemplate
                    restaurantName={restaurantName}
                    currency={currency}
                    categories={categories}
                    cartProps={cartProps}
                />
            );
        }
        if (template === 'playful') {
            return (
                <PlayfulTemplate
                    restaurantName={restaurantName}
                    currency={currency}
                    categories={categories}
                    cartProps={cartProps}
                />
            );
        }
        return (
            <ModernTemplate
                restaurantName={restaurantName}
                currency={currency}
                categories={categories}
                cartProps={cartProps}
            />
        );
    };

    return (
        <>
            {renderTemplate()}
            {orderingEnabled && (
                <WhatsAppCartBar
                    cartSummary={cartSummary}
                    currencySymbol={currency}
                    restaurantName={restaurantName}
                    whatsappNumber={whatsappNumber}
                    initialTableNumber={initialTableNumber}
                    onIncrementKey={handleIncrementByKey}
                    onDecrementKey={handleDecrementByKey}
                    onClearCart={handleClearCart}
                />
            )}
        </>
    );
};

export default MenuViewPage;
