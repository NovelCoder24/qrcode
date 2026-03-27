import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, ExternalLink, Copy, Check, Loader2, QrCode as QrCodeIcon, Calendar, ScanLine, Clock, Globe, Palette } from 'lucide-react';
import StyledQRCode from '../components/StyledQRCode';
import api from '../api/axios';

const timeAgo = (dateString) => {
    if (!dateString) return '—';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
};

const QRDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [qr, setQr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                const { data } = await api.get(`/qrcodes/${id}`);
                setQr(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load QR code');
            } finally {
                setLoading(false);
            }
        };
        fetchQR();
    }, [id]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        // Navigate to create page step 3 with the QR ID as a query param
        navigate(`/create?step=3&edit=${qr._id}`);
    };

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center p-10 gap-4">
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={() => navigate('/qrcodes')} className="text-indigo-600 font-semibold text-sm hover:underline">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const design = qr?.customization || {};
    const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/r/${qr?.short_id}`;

    return (
        <div className="p-6 md:p-10 bg-slate-50 min-h-full">
            {/* Back Button */}
            <button
                onClick={() => navigate('/qrcodes')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: QR Preview Card */}
                <div className="lg:w-[380px] flex-shrink-0">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col items-center">
                        <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
                            <StyledQRCode
                                data={shortUrl}
                                size={220}
                                ecLevel="H"
                                primaryColor={design.fgColor || '#000000'}
                                bgColor={design.bgColor || '#ffffff'}
                                dotStyle={design.qrStyle || 'square'}
                                cornerSquareStyle={design.eyeShape === 'circle' ? 'dot' : 'square'}
                                cornerDotStyle={design.eyeShape === 'circle' ? 'dot' : 'square'}
                                logo={design.logoUrl || undefined}
                            />
                        </div>

                        <h2 className="text-xl font-extrabold text-slate-900 mb-1 text-center">
                            {qr?.metadata?.title || 'Untitled QR'}
                        </h2>
                        <span className="text-xs font-mono text-slate-400 mb-6">ID: {qr?.short_id}</span>

                        {/* Action Buttons */}
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={handleEdit}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit Design
                            </button>
                            <a
                                href={qr?.target_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Visit
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right: Details */}
                <div className="flex-1 space-y-6">
                    {/* URL Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            Target URL
                        </h3>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                            <p className="flex-1 text-sm text-slate-600 font-mono truncate">{qr?.target_url}</p>
                            <button
                                onClick={() => handleCopy(qr?.target_url)}
                                className="p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                                title="Copy URL"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                            </button>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ScanLine className="w-4 h-4 text-indigo-500" />
                            Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-indigo-50 rounded-xl p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Total Scans</p>
                                <p className="text-xl font-black text-indigo-700">{(qr?.stats?.total_scans || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Last Scanned</p>
                                <p className="text-sm font-bold text-slate-700">{timeAgo(qr?.stats?.last_scanned_at)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <p className={`text-sm font-bold ${qr?.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {qr?.isActive ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Design Details Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-indigo-500" />
                            Design Details
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg border border-slate-200" style={{ backgroundColor: design.fgColor || '#000000' }}></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Foreground</p>
                                    <p className="text-xs font-mono text-slate-600">{design.fgColor || '#000000'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg border border-slate-200" style={{ backgroundColor: design.bgColor || '#ffffff' }}></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Background</p>
                                    <p className="text-xs font-mono text-slate-600">{design.bgColor || '#ffffff'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pattern</p>
                                <p className="text-sm font-semibold text-slate-700 capitalize">{design.qrStyle || 'squares'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Corner Shape</p>
                                <p className="text-sm font-semibold text-slate-700 capitalize">{design.eyeShape || 'square'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Frame</p>
                                <p className="text-sm font-semibold text-slate-700 capitalize">{design.frame || 'none'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">QR Type</p>
                                <p className="text-sm font-semibold text-slate-700">{qr?.qr_type || 'URL'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            Metadata
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {qr?.createdAt ? new Date(qr.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Updated</p>
                                <p className="text-sm font-semibold text-slate-700">
                                    {qr?.updatedAt ? new Date(qr.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRDetailPage;
