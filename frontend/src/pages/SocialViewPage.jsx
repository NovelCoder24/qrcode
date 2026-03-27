import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Loader2, AlertCircle, QrCode } from 'lucide-react';
import axios from 'axios';

// Platform config for icons and colors
const platformConfig = {
    facebook: { name: 'Facebook', color: '#1877F2', bg: '#E7F3FF' },
    instagram: { name: 'Instagram', color: '#E4405F', bg: '#FDE8ED' },
    twitter: { name: 'Twitter / X', color: '#1DA1F2', bg: '#E8F5FD' },
    linkedin: { name: 'LinkedIn', color: '#0A66C2', bg: '#E5F0F9' },
    youtube: { name: 'YouTube', color: '#FF0000', bg: '#FFE5E5' },
    whatsapp: { name: 'WhatsApp', color: '#25D366', bg: '#E3F9ED' },
    website: { name: 'Website', color: '#4F46E5', bg: '#EEF2FF' },
};

const SocialViewPage = () => {
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
                setError(err.response?.data?.message || 'This QR code could not be found.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [shortId, apiBase]);

    if (loading) {
        return (
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Loading social links...</p>
                </div>
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                    <p className="text-slate-500 text-sm">{error || 'This QR code does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (!qrData.isActive) {
        return (
            <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">QR Code Inactive</h1>
                    <p className="text-slate-500 text-sm">This QR code has been deactivated by the owner.</p>
                </div>
            </div>
        );
    }

    const m = qrData.metadata || {};
    const primaryColor = qrData.customization?.fgColor || '#4F46E5';
    const links = m.socialLinks || [];
    const pageTitle = m.pageTitle || m.title || 'My Links';
    const description = m.description || '';

    return (
        <div className="w-full min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-[400px]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {pageTitle.charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
                        {description && (
                            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">{description}</p>
                        )}
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3">
                        {links.map((link, i) => {
                            if (!link.url) return null;
                            const config = platformConfig[link.platform] || { name: link.platform, color: '#4F46E5', bg: '#EEF2FF' };

                            // Build proper URL for WhatsApp numbers
                            let href = link.url;
                            if (link.platform === 'whatsapp') {
                                const clean = link.url.replace(/\D/g, '');
                                href = `https://wa.me/${clean}`;
                            } else if (!/^https?:\/\//i.test(href)) {
                                href = `https://${href}`;
                            }

                            return (
                                <a
                                    key={i}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                                >
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                                        style={{ backgroundColor: config.bg, color: config.color }}
                                    >
                                        {config.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800">{config.name}</p>
                                        <p className="text-xs text-slate-400 truncate">{link.url}</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                                </a>
                            );
                        })}

                        {links.length === 0 && (
                            <div className="text-center py-12 text-slate-400 text-sm">
                                No social links added yet.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-3 flex-shrink-0">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <div className="bg-indigo-600 p-1 rounded">
                        <QrCode className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium">
                        Powered by <span className="text-indigo-600 font-semibold">Qrio</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default SocialViewPage;
