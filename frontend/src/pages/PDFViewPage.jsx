import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, Loader2, AlertCircle, QrCode } from 'lucide-react';
import axios from 'axios';

const PDFViewPage = () => {
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error || !qrData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                    <p className="text-slate-500 text-sm">{error || 'This QR code does not exist.'}</p>
                </div>
            </div>
        );
    }

    if (!qrData.isActive) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    <AlertCircle className="w-14 h-14 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">QR Code Inactive</h1>
                    <p className="text-slate-500 text-sm">This QR code has been deactivated by the owner.</p>
                </div>
            </div>
        );
    }

    const primaryColor = qrData.customization?.fgColor || '#4F46E5';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">

                    {/* Top Color Band */}
                    <div
                        className="h-2 w-full"
                        style={{ background: `linear-gradient(90deg, ${primaryColor}, #6366f1)` }}
                    />

                    {/* Content */}
                    <div className="p-8 sm:p-10 text-center">
                        {/* Company */}
                        {qrData.company && (
                            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-6">
                                {qrData.company}
                            </p>
                        )}

                        {/* PDF Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}15` }}
                        >
                            <FileText className="w-10 h-10" style={{ color: primaryColor }} />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                            {qrData.title}
                        </h1>

                        {/* Description */}
                        {qrData.description && (
                            <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                                {qrData.description}
                            </p>
                        )}

                        {!qrData.description && <div className="mb-8" />}

                        {/* Download Button */}
                        <a
                            href={qrData.target_url.replace('/upload/', '/upload/fl_attachment/')}
                            download
                            className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl text-white font-bold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Download className="w-5 h-5" />
                            Download PDF
                        </a>

                        {/* File info */}
                        <p className="text-[11px] text-slate-400 mt-4">
                            PDF Document • Tap to download
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <footer className="py-6 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <div className="bg-indigo-600 p-1 rounded">
                        <QrCode className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold">
                        Powered by <span className="text-indigo-600">QRVibe</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default PDFViewPage;
